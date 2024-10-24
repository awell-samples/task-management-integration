import { BadRequestError, NotFoundError } from "../error";
import { type Task, TaskStatus, Ephemeral } from "../types";
import _, { isEmpty, isNil } from "lodash";
import { FastifyBaseLogger } from "fastify";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import {
  Prisma,
  PrismaClient,
  TaskAssignment,
  TaskIdentifier,
} from "@prisma/client";
import { Inject, Service } from "typedi";

export interface FindAllOptions {
  status?: string[];
  patient_id?: string;
  user_id?: string;
  populate?: boolean;
}

const extendedPrisma = (prisma: PrismaClient) =>
  prisma.$extends({
    result: {
      task: {
        task_data: {
          needs: { task_data: true, id: true },
          compute(task) {
            if (typeof task.task_data === "string") {
              try {
                return JSON.parse(task.task_data);
              } catch (error) {
                console.error(
                  `Failed to parse task_data for task ID ${task.id}`,
                  error,
                );
                return task.task_data;
              }
            }
            return task.task_data;
          },
        },
      },
    },
  });

@Service()
export default class TaskService {
  extendedPrisma;
  constructor(
    @Inject("prisma") private prisma: PrismaClient,
    @Inject("logger") private logger: FastifyBaseLogger,
  ) {
    this.extendedPrisma = extendedPrisma(prisma);
  }

  async create(task: Ephemeral<Task>) {
    const task_identifiers: TaskIdentifier[] = [];
    const task_assignments: TaskAssignment[] = [];
    try {
      const createdTask = await this.prisma.$transaction(async (tx) => {
        const t = await tx.task.create({
          data: {
            title: task.title,
            description: task.description,
            due_at: task.due_at,
            task_type: task.task_type,
            task_data: JSON.stringify(task.task_data),
            status: task.status,
            priority: task.priority,
            patient_id: task.patient_id,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });
        if (!isNil(task.identifiers) && !isEmpty(task.identifiers)) {
          for (const identifier of task.identifiers) {
            const taskIdentifier = await tx.taskIdentifier.create({
              data: {
                task_id: t.id,
                system: identifier.system,
                value: identifier.value,
              },
            });
            console.log("taskIdentifier", taskIdentifier);
            task_identifiers.push(taskIdentifier);
          }
        }
        if (
          !isNil(task.assigned_to_user_id) &&
          !isNil(task.assigned_by_user_id) &&
          !isEmpty(task.assigned_to_user_id) &&
          !isEmpty(task.assigned_by_user_id)
        ) {
          const assignment = await tx.taskAssignment.create({
            data: {
              task_id: t.id,
              assigned_by_user_id: task.assigned_by_user_id,
              assigned_to_user_id: task.assigned_to_user_id,
            },
          });
          console.log("assignment", assignment);
          task_assignments.push(assignment);
        }

        return {
          ...t,
          ...(task_identifiers.length && { identifiers: task_identifiers }),
          ...(task_assignments.length && { task_assignments }),
        };
      });
      this.logger.debug({ msg: "Created task", data: { task: createdTask } });

      return createdTask;
    } catch (err) {
      this.logger.error({ msg: "Error creating task", err });
      if (err instanceof PrismaClientKnownRequestError) {
        const understandableMessage = err.message.split("\n").pop() as string;
        throw new BadRequestError(understandableMessage, { task }, err.stack);
      }
      throw err;
    }
  }

  async findAll(options: FindAllOptions = {}) {
    const { status, patient_id, populate, user_id } = options;
    const queryOptions: Prisma.TaskWhereInput[] = [];
    if (!_.isNil(status)) {
      queryOptions.push({ status: { in: status.map((s) => s as TaskStatus) } });
    }
    if (!_.isNil(patient_id)) {
      queryOptions.push({ patient_id: { equals: patient_id } });
    }
    if (!_.isNil(user_id)) {
      queryOptions.push({
        task_assignments: {
          every: {
            assigned_to_user_id: user_id,
          },
        },
      });
    }
    this.logger.debug({ msg: "Finding tasks", data: { options } });
    const tasks = await this.extendedPrisma.task.findMany({
      where: {
        AND: queryOptions,
      },
      include: {
        task_identifiers: {
          select: {
            system: true,
            value: true,
          },
        },
        task_assignments: Boolean(populate)
          ? {
              select: {
                assigned_by_user: true,
                assigned_to_user: true,
              },
            }
          : false,
        comments: Boolean(populate)
          ? {
              select: {
                comment: true,
              },
            }
          : false,
        patient: {
          select: {
            first_name: true,
            last_name: true,
            patient_identifiers: {
              select: {
                system: true,
                value: true,
              },
            },
          },
        },
      },
    });
    this.logger.debug({
      msg: "Returning tasks",
      data: { count: tasks.length, options },
    });
    return tasks;
  }

  async findByAwellActivityId(activityId: string) {
    const task = await this.extendedPrisma.$transaction(async (tx) => {
      const identifier = await tx.taskIdentifier.findUnique({
        where: {
          system_value: {
            system: "https://awellhealth.com/activity",
            value: activityId,
          },
        },
        include: {
          task: {
            include: {
              task_identifiers: true,
              task_assignments: {
                include: {
                  assigned_by_user: true,
                  assigned_to_user: true,
                },
              },
              comments: {
                include: {
                  comment: {
                    include: {
                      created_by: true,
                      updated_by: true,
                    },
                  },
                },
              },
              patient: {
                select: {
                  first_name: true,
                  last_name: true,
                  patient_identifiers: {
                    select: {
                      system: true,
                      value: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      return identifier?.task;
    });
    this.logger.debug({
      msg: "Returning task",
      data: { activity_id: activityId },
    });
    return task;
  }

  async findById(id: string) {
    const task = await this.extendedPrisma.task.findUnique({
      where: {
        id,
      },
      include: {
        task_identifiers: true,
        task_assignments: {
          select: {
            assigned_to_user: true,
            assigned_by_user: true,
          },
        },
        comments: {
          include: { comment: true },
        },
      },
    });
    if (!task) {
      throw new NotFoundError("Task not found", { id });
    }
    this.logger.debug({ msg: "Returning task", data: { id } });
    return task;
  }

  async findByPatientId(patientId: string) {
    const tasks = await this.extendedPrisma.task.findMany({
      where: {
        patient_id: patientId,
      },
      include: {
        task_identifiers: true,
        task_assignments: true,
        comments: {
          include: {
            comment: true,
          },
        },
      },
    });
    if (tasks.length === 0) {
      throw new NotFoundError("No tasks found for this patient", {
        patient_id: patientId,
      });
    }
    this.logger.debug({
      msg: "Returning tasks",
      data: { count: tasks.length, patientId },
    });
    return tasks;
  }

  async update(task: Partial<Task>) {
    const currentTask = await this.findById(task.id!);
    if (!currentTask) {
      throw new NotFoundError("Task not found", { id: task.id });
    }
    try {
      const updatedTask = await this.prisma.task.update({
        where: {
          id: task.id,
        },
        data: {
          title: task.title,
          description: task.description,
          due_at: task.due_at,
          task_type: task.task_type,
          task_data: JSON.stringify(task.task_data),
          status: task.status,
          priority: task.priority,
          patient_id: task.patient_id,
          updated_at: new Date(),
        },
      });
      this.logger.debug({ msg: "Updated task", data: { task: updatedTask } });
      return updatedTask;
    } catch (err) {
      this.logger.debug({ msg: "Could not perform update", data: { task } });
      const error = err as unknown as Error;
      throw new BadRequestError(error.message, { task }, error.stack);
    }
  }

  async updateStatus(task: Partial<Task>) {
    if (!task.status || !Object.values(TaskStatus).includes(task.status)) {
      throw new BadRequestError("Invalid task status", { status: task.status });
    }
    const updatedTask = await this.prisma.task.update({
      where: {
        id: task.id,
      },
      data: {
        status: task.status,
        updated_at: new Date(),
      },
    });
    this.logger.debug({
      msg: "Updated task status",
      data: {
        id: task.id,
        status: task.status,
      },
    });
    return updatedTask;
  }

  async assignTaskToUser(
    taskId: string,
    assignment: Pick<
      TaskAssignment,
      "assigned_to_user_id" | "assigned_by_user_id"
    >,
  ) {
    // right now we're only going to allow tasks to be assigned to one person. In the future,
    // we may allow multiple assignments for a single task.
    const task = await this.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found", { taskId });
    }
    const currentAssignment = await this.prisma.taskAssignment.findFirst({
      where: {
        task_id: taskId,
      },
    });
    if (currentAssignment) {
      const newAssignment = await this.prisma.taskAssignment.update({
        where: {
          id: currentAssignment.id,
        },
        data: assignment,
      });
      this.logger.debug({
        msg: "re-assigned task to user",
        data: {
          taskId,
          newAssignment,
        },
      });
    } else {
      const taskAssignment = await this.prisma.taskAssignment.create({
        data: {
          task_id: taskId,
          ...assignment,
        },
      });
      this.logger.debug({
        msg: "Assigned task to user",
        data: {
          taskId,
          taskAssignment,
        },
      });
    }
    const assignedTask = await this.findById(taskId);
    return assignedTask;
  }

  async removeTaskAssignment(taskId: string, assignedToUserId: string) {
    const task = await this.findById(taskId);
    if (!task) {
      throw new NotFoundError("Task not found", { taskId });
    }
    const taskAssignment = await this.prisma.taskAssignment.deleteMany({
      where: {
        task_id: taskId,
        assigned_to_user_id: assignedToUserId,
      },
    });
    this.logger.debug({
      msg: "Removed task assignment",
      data: {
        taskId,
        taskAssignment,
      },
    });
    const unassignedTask = await this.findById(taskId);
    return unassignedTask;
  }

  async delete(id: string) {
    const task = await this.findById(id);
    if (!task) {
      throw new NotFoundError("Task not found", { id });
    }
    await this.prisma.task.delete({
      where: {
        id,
      },
    });
    this.logger.debug({ msg: "Deleted task", data: { id } });
  }
}
