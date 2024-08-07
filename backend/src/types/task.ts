export interface Task {
  id?: number; // Optional because it will be auto-generated
  title: string;
  description?: string;
  due_at?: Date;
  assignee?: string; // Assuming UUIDs are strings
  task_type?: string;
  task_data?: Record<string, any>; // Assuming task_data is a flexible JSON object
  identifiers?: { system: string; value: string }[];
  status?: TaskStatus;
  priority?: string;
  comments?: string[];
  assigned_by?: string; // Assuming UUIDs are strings
  completed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
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
    required: ["title", "task_type", "identifiers"],
    properties: {
      title: { type: "string" },
      description: { type: "string" },
      due_at: { type: "string", format: "date-time" },
      assignee: { type: "string", format: "uuid" },
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
      comments: { type: "array", items: { type: "string" } },
      assigned_by: { type: "string", format: "uuid" },
      completed_at: { type: "string", format: "date-time" },
    },
  },
};
