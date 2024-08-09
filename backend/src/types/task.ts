import { Identifier } from "./identifier";
import { Patient } from "./patient";
import { User } from "./user";

export interface Task {
  id?: string;
  title: string;
  description?: string;
  due_at?: Date;
  task_type?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task_data?: Record<string, any>; // Assuming task_data is a flexible JSON object
  status?: TaskStatus;
  priority?: string;
  patient_id?: string;
  assigned_to_user_id?: string;
  assigned_by_user_id?: string;
  completed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
  identifiers?: Identifier[];
}

export interface PopulatedTask extends Task {
  assigned_to?: User;
  assigned_by?: User;
  patient?: Patient;
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  STUCK = "stuck",
}

export const CreateTaskSchema = {
  body: {
    type: "object",
    required: ["title", "task_type"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      due_at: { type: "string", format: "date-time" },
      task_type: { type: "string" },
      task_data: { type: "object" },
      identifiers: {
        type: "array",
        items: {
          type: "object",
          required: ["system", "value"],
          properties: {
            system: { type: "string" },
            value: { type: "string" },
          },
        },
      },
      status: {
        type: "string",
        enum: ["pending", "in_progress", "completed", "cancelled", "stuck"],
      },
      priority: { type: "string" },
      patient_id: { type: "string", format: "uuid" },
      assigned_to_user_id: { type: "string", format: "uuid" },
      assigned_by_user_id: { type: "string", format: "uuid" },
      completed_at: { type: "string", format: "date-time" },
    },
  },
};
