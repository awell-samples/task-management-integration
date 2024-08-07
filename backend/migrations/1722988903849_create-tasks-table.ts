import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("tasks", {
    id: "id",
    title: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    due_at: { type: "timestamp" },
    assignee: { type: "uuid" },
    task_type: { type: "varchar(50)" },
    task_data: { type: "jsonb" },
    identifiers: { type: "jsonb" },
    status: { type: "varchar(50)", default: "pending" },
    priority: { type: "varchar(50)" },
    comments: { type: "text[]" },
    assigned_by: { type: "uuid" },
    completed_at: { type: "timestamp" },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", default: pgm.func("current_timestamp") },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("tasks");
}
