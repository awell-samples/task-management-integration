import { BadRequestError, NotFoundError } from "../error";
import {
  Identifier,
  Patient,
  type Task,
  type PopulatedTask,
  TaskStatus,
} from "../types";
import _ from "lodash";
import { FastifyInstance } from "fastify";

export interface FindAllOptions {
  status?: string[];
  patient_id?: string;
  populate?: boolean;
}

export default class TaskService {
  private _pg: FastifyInstance["pg"];
  private logger: FastifyInstance["log"];

  constructor(fastify: FastifyInstance) {
    this._pg = fastify.pg;
    this.logger = fastify.log;
  }

  async create(task: Task) {
    try {
      await this._pg.query("BEGIN");
      const { rows } = await this._pg.query(
        `INSERT INTO tasks (
          id, title, description, due_at, task_type, task_data, status, priority, 
          patient_id, assigned_to_user_id, assigned_by_user_id, created_at, updated_at
        ) VALUES (
          uuid_generate_v4(), $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, NOW(), NOW()
        ) RETURNING *`,
        [
          task.title,
          task.description,
          task.due_at,
          task.task_type,
          JSON.stringify(task.task_data),
          task.status?.toString(),
          task.priority,
          task.patient_id,
          task.assigned_to_user_id,
          task.assigned_by_user_id,
        ],
      );
      const createdTask = rows[0];
      this.logger.debug({ msg: "Created task", data: { task: createdTask } });
      await this.insertIdentifiers(createdTask.id, task.identifiers);
      this.logger.debug({
        msg: "Inserted identifiers",
        data: {
          identifiers: task.identifiers,
        },
      });
      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
    } catch (err) {
      await this._pg.query("ROLLBACK");
      this.logger.debug("Rolled back transaction");
      const error = err as unknown as Error;
      throw new BadRequestError(error.message, { task }, error.stack);
    }
  }

  async findAll(options: FindAllOptions = {}) {
    const { status, patient_id, populate } = options;
    this.logger.debug({ msg: "Finding tasks", data: { options } });
    let query = `
      SELECT 
        t.*,
        ${populate ? "json_build_object('id', ab.id, 'first_name', ab.first_name, 'last_name', ab.last_name, 'email', ab.email) as assigned_by," : ""}
        ${populate ? "json_build_object('id', at.id, 'first_name', at.first_name, 'last_name', at.last_name, 'email', at.email) as assigned_to," : ""}
        ${populate ? "json_build_object('id', p.id, 'first_name', p.first_name, 'last_name', p.last_name) as patient," : ""}
        json_agg(json_build_object('system', ti.system, 'value', ti.value)) AS identifiers
      FROM tasks t
      LEFT JOIN tasks_identifiers ti ON t.id = ti.task_id
      ${populate ? "LEFT JOIN users ab ON t.assigned_by_user_id = ab.id" : ""}
      ${populate ? "LEFT JOIN users at ON t.assigned_to_user_id = at.id" : ""}
      ${populate ? "LEFT JOIN patients p ON t.patient_id = p.id" : ""}
    `;

    const conditions = [];
    const params: (string | string[])[] = [];

    // Handle status filter
    if (!_.isNil(status) && status.length > 0) {
      conditions.push(`t.status = ANY($${params.length + 1})`);
      params.push(status);
    }

    // Handle patient_id filter
    if (!_.isNil(patient_id)) {
      conditions.push(`t.patient_id = $${params.length + 1}`);
      params.push(patient_id);
    }

    // Add conditions to the query
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` GROUP BY t.id ${populate ? ", ab.id, at.id, p.id" : ""}`;
    this.logger.debug({ msg: "Query", data: { query, params } });
    const result = await this._pg.query(query, params);
    this.logger.debug({
      msg: "Returning tasks",
      data: { count: result.rows.length },
    });
    return result.rows;
  }

  async findPopulatedTaskById(taskId: string) {
    const { rows } = await this._pg.query(
      `SELECT t.*, 
              json_build_object(
                'id', ub.id, 
                'first_name', ub.first_name, 
                'last_name', ub.last_name, 
                'email', ub.email
              ) AS assigned_by,
              json_build_object(
                'id', ut.id, 
                'first_name', ut.first_name, 
                'last_name', ut.last_name, 
                'email', ut.email
              ) AS assigned_to,
              json_build_object(
                'id', p.id, 
                'first_name', p.first_name, 
                'last_name', p.last_name,
                'identifiers', json_agg(
                  json_build_object('system', pi.system, 'value', pi.value)
                )
              ) AS patient,
              json_agg(
                json_build_object('system', ti.system, 'value', ti.value)
              ) AS identifiers
       FROM tasks t
       LEFT JOIN users ub ON t.assigned_by_user_id = ub.id
       LEFT JOIN users ut ON t.assigned_to_user_id = ut.id
       LEFT JOIN patients p ON t.patient_id = p.id
       LEFT JOIN tasks_identifiers ti ON t.id = ti.task_id
       LEFT JOIN patients_identifiers pi ON p.id = pi.patient_id
       WHERE t.id = $1
       GROUP BY t.id, ub.id, ut.id, p.id`,
      [taskId],
    );

    if (rows.length === 0) {
      throw new NotFoundError("Task not found", { id: taskId });
    }
    this.logger.debug({ msg: "Returning task", data: { id: taskId } });
    return rows.map((t) => this.populateTask(t))[0];
  }

  async findByAwellActivityId(activityId: string) {
    const { rows } = await this._pg.query(
      `SELECT t.*, 
              json_agg(json_build_object('system', ti.system, 'value', ti.value)) AS identifiers
       FROM tasks t
       LEFT JOIN tasks_identifiers ti ON t.id = ti.task_id
       WHERE ti.system = $1 AND ti.value = $2
       GROUP BY t.id
       LIMIT 1`,
      ["https://awellhealth.com", activityId],
    );

    if (rows.length === 0) {
      throw new NotFoundError("Task not found", { activity_id: activityId });
    }
    this.logger.debug({
      msg: "Returning task",
      data: { activity_id: activityId },
    });
    const task = rows.map(this.maybeWithIdentifiers)[0];
    return task;
  }

  async findById(id: string) {
    const { rows } = await this._pg.query(
      `SELECT t.*, 
              json_agg(json_build_object('system', ti.system, 'value', ti.value)) AS identifiers
       FROM tasks t
       LEFT JOIN tasks_identifiers ti ON t.id = ti.task_id
       WHERE t.id = $1
       GROUP BY t.id
       LIMIT 1`,
      [id],
    );

    if (rows.length === 0) {
      throw new NotFoundError("Task not found", { id });
    }
    this.logger.debug({ msg: "Returning task", data: { id, task: rows[0] } });
    const task = rows.map(this.maybeWithIdentifiers)[0];
    return task;
  }

  async findByPatientId(patientId: string) {
    const { rows } = await this._pg.query(
      `SELECT t.*, 
              json_agg(json_build_object('system', ti.system, 'value', ti.value)) AS identifiers
       FROM tasks t
       LEFT JOIN tasks_identifiers ti ON t.id = ti.task_id
       WHERE t.patient_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [patientId],
    );

    if (rows.length === 0) {
      throw new NotFoundError("No tasks found for this patient", {
        patient_id: patientId,
      });
    }
    this.logger.debug({ msg: "Returning tasks", data: { count: rows.length } });
    return rows.map(this.maybeWithIdentifiers);
  }

  async update(task: Partial<Task>) {
    const currentTask = await this.findById(task.id!);
    if (!currentTask) {
      throw new NotFoundError("Task not found", { id: task.id });
    }
    const mergedTask = _.merge({}, currentTask, task);
    this.logger.debug({ msg: "Merged task", data: { task: mergedTask } });

    try {
      await this._pg.query("BEGIN");

      const { rows } = await this._pg.query(
        `UPDATE tasks SET 
          title = $1, description = $2, due_at = $3, task_type = $4, task_data = $5, 
          status = $6, priority = $7, assigned_to_user_id = $8, assigned_by_user_id = $9, 
          patient_id = $10, updated_at = NOW() WHERE id = $11 RETURNING *`,
        [
          mergedTask.title,
          mergedTask.description,
          mergedTask.due_at,
          mergedTask.task_type,
          JSON.stringify(mergedTask.task_data),
          mergedTask.status?.toString(),
          mergedTask.priority,
          mergedTask.assigned_to_user_id,
          mergedTask.assigned_by_user_id,
          mergedTask.patient_id,
          mergedTask.id,
        ],
      );
      this.logger.debug({ msg: "Updated task", data: { task: rows[0] } });
      await this.updateIdentifiers(mergedTask.id!, task.identifiers);
      this.logger.debug({
        msg: "Updated identifiers",
        data: {
          identifiers: task.identifiers,
        },
      });
      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
      const updatedTask = rows.map(this.maybeWithIdentifiers)[0];
      return { ...updatedTask, identifiers: mergedTask.identifiers };
    } catch (err) {
      await this._pg.query("ROLLBACK");
      this.logger.debug("Rolled back transaction");
      const error = err as unknown as Error;
      throw new BadRequestError(error.message, { task }, error.stack);
    }
  }

  async updateStatus(task: Partial<Task>) {
    if (!task.status || !Object.values(TaskStatus).includes(task.status)) {
      throw new BadRequestError("Invalid task status", { status: task.status });
    }
    await this._pg.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [task.status.toString(), task.id],
    );
    this.logger.debug({
      msg: "Updated task status",
      data: {
        id: task.id,
        status: task.status,
      },
    });
  }

  async delete(id: string) {
    try {
      await this._pg.query("BEGIN");
      this.logger.debug({ msg: "Deleting task", data: { id } });
      await this._pg.query("DELETE FROM tasks_identifiers WHERE task_id = $1", [
        id,
      ]);
      this.logger.debug({ msg: "Deleted identifiers", data: { task_id: id } });
      const { rowCount } = await this._pg.query(
        "DELETE FROM tasks WHERE id = $1",
        [id],
      );
      this.logger.debug({ msg: "Deleted task", data: { id } });
      if (rowCount === 0) {
        throw new NotFoundError("Task not found", { id });
      }
      await this._pg.query("COMMIT");
      this.logger.debug("Committed transaction");
    } catch (err) {
      await this._pg.query("ROLLBACK");
      this.logger.debug("Rolled back transaction");
      throw err;
    }
  }

  private async insertIdentifiers(
    taskId: string,
    identifiers: Identifier[] = [],
  ) {
    for (const identifier of identifiers) {
      await this._pg.query(
        `INSERT INTO tasks_identifiers (task_id, system, value) VALUES ($1, $2, $3)`,
        [taskId, identifier.system, identifier.value],
      );
    }
  }

  private async updateIdentifiers(
    taskId: string,
    identifiers: Identifier[] = [],
  ) {
    const client = await this._pg.connect();
    try {
      await client.query("BEGIN");
      const { rows: currentIdentifiers } = await client.query(
        "SELECT system, value FROM tasks_identifiers WHERE task_id = $1",
        [taskId],
      );
      const identifiersToDelete = currentIdentifiers.filter(
        (current) =>
          !identifiers.some(
            (identifier) =>
              identifier.system === current.system &&
              identifier.value === current.value,
          ),
      );

      const identifiersToAdd = identifiers.filter(
        (identifier) =>
          !currentIdentifiers.some(
            (current) =>
              identifier.system === current.system &&
              identifier.value === current.value,
          ),
      );

      // Delete identifiers that are not in the updated list
      for (const identifier of identifiersToDelete) {
        await client.query(
          "DELETE FROM tasks_identifiers WHERE task_id = $1 AND system = $2 AND value = $3",
          [taskId, identifier.system, identifier.value],
        );
        this.logger.debug({ msg: "Deleted identifier", data: { identifier } });
      }

      // Insert new identifiers
      await this.insertIdentifiers(taskId, identifiersToAdd);
      this.logger.debug({
        msg: "Inserted identifiers",
        data: {
          identifiers: identifiersToAdd,
        },
      });
      await client.query("COMMIT");
      this.logger.debug("Committed transaction");
    } catch (err) {
      await client.query("ROLLBACK");
      this.logger.debug("Rolled back transaction");
      throw err;
    } finally {
      client.release();
    }
  }

  private maybeWithIdentifiers(resource: Task | Patient) {
    return {
      ...resource,
      ...(resource.identifiers && {
        identifiers: resource.identifiers.filter(
          (i: Identifier) => !_.isNil(i.system) && !_.isNil(i.value),
        ),
      }),
    };
  }

  private populateTask(task: PopulatedTask) {
    const { patient, assigned_by, assigned_to, ...rest } = task;
    return {
      ...this.maybeWithIdentifiers(rest),
      ...(!_.isNil(patient?.id) && {
        patient: this.maybeWithIdentifiers(patient),
      }),
      ...(!_.isNil(assigned_by?.id) && {
        assigned_by,
      }),
      ...(!_.isNil(assigned_to) && {
        assigned_to,
      }),
    };
  }
}
