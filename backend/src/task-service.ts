import { BadRequestError, NotFoundError } from "./error";
import { type Task } from "./types";
import { Client } from "pg";
import _ from "lodash";

export default class TaskService {
  private _client: Client;

  constructor(client: Client) {
    this._client = client;
  }

  async create(task: Task) {
    try {
      const { rows } = await this._client.query(
        "INSERT INTO tasks (title, description, due_at, assignee, task_type, task_data, identifiers, status, priority, comments, assigned_by, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()) RETURNING *",
        [
          task.title,
          task.description,
          task.due_at,
          task.assignee,
          task.task_type,
          JSON.stringify(task.task_data),
          JSON.stringify(task.identifiers),
          task.status?.toString(),
          task.priority,
          task.comments,
          task.assigned_by,
        ],
      );
      return rows[0];
    } catch (err) {
      const error = err as unknown as Error;
      throw new BadRequestError(error.message, { task }, error.stack);
    }
  }

  async findAll() {
    const { rows } = await this._client.query(
      "SELECT * FROM tasks ORDER BY created_at DESC",
    );
    return rows;
  }

  async findByAwellActivityId(activityId: string) {
    const { rows } = await this._client.query(
      "SELECT * FROM tasks WHERE identifiers @> $1::jsonb LIMIT 1",
      [
        JSON.stringify([
          {
            system: "https://awellhealth.com",
            value: activityId,
          },
        ]),
      ],
    );
    if (rows.length === 0) {
      throw new NotFoundError("Task not found", { activity_id: activityId });
    }
    const task = {
      ...rows[0],
      identifiers: rows[0].identifiers,
      task_data: rows[0].task_data,
    };
    return task;
  }

  async findById(id: string) {
    const { rows } = await this._client.query(
      "SELECT * FROM tasks WHERE id = $1 LIMIT 1",
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundError("Task not found", { id });
    }
    return rows[0];
  }

  async update(task: Partial<Task>) {
    const currentTask = await this.findById(task.id!.toString());
    if (!currentTask) {
      throw new NotFoundError("Task not found", { id: task.id });
    }
    const mergedTask = _.merge({}, currentTask, task);
    const { rows } = await this._client.query(
      "UPDATE tasks SET title = $1, description = $2, due_at = $3, assignee = $4, task_type = $5, task_data = $6, identifiers = $7, status = $8, priority = $9, comments = $10, assigned_by = $11, updated_at = NOW() WHERE id = $12 RETURNING *",
      [
        mergedTask.title,
        mergedTask.description,
        mergedTask.due_at,
        mergedTask.assignee,
        mergedTask.task_type,
        JSON.stringify(mergedTask.task_data),
        JSON.stringify((mergedTask.identifiers ?? []).filter(Boolean)),
        mergedTask.status?.toString(),
        mergedTask.priority,
        mergedTask.comments,
        mergedTask.assigned_by,
        mergedTask.id,
      ],
    );
    if (rows.length === 0) {
      throw new NotFoundError("Task not found", { id: task.id });
    }
    return rows[0];
  }

  async delete(id: string) {
    const { rowCount } = await this._client.query(
      "DELETE FROM tasks WHERE id = $1",
      [id],
    );
    if (rowCount === 0) {
      throw new NotFoundError("Task not found", { id });
    }
  }
}
