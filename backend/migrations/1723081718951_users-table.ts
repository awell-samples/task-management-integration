import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create the users table
  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    first_name: {
      type: "text",
      notNull: true,
    },
    last_name: {
      type: "text",
      notNull: true,
    },
    email: {
      type: "text",
      notNull: true,
      unique: true,
    },
    created_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
    updated_at: {
      type: "timestamp",
      notNull: true,
      default: pgm.func("current_timestamp"),
    },
  });

  // Remove the assignee column from the tasks table
  pgm.dropColumn("tasks", "assignee");

  // Add assigned_to_user_id and assigned_by_user_id columns to the tasks table
  pgm.addColumns("tasks", {
    assigned_to_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    assigned_by_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop the assigned_to_user_id and assigned_by_user_id columns from the tasks table
  pgm.dropColumns("tasks", ["assigned_to_user_id", "assigned_by_user_id"]);

  // Add the assignee column back to the tasks table
  pgm.addColumn("tasks", {
    assignee: {
      type: "uuid",
    },
  });

  // Drop the users table
  pgm.dropTable("users");
}
