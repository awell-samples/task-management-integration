import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Enable the uuid-ossp extension if not already enabled
  pgm.createExtension("uuid-ossp", { ifNotExists: true });

  // Alter the tasks table to change the primary key to UUID
  pgm.addColumns("tasks", {
    id_uuid: {
      type: "uuid",
      default: pgm.func("uuid_generate_v4()"),
      notNull: true,
    },
  });

  // Drop the old numeric primary key
  pgm.dropConstraint("tasks", "tasks_pkey");
  pgm.dropColumn("tasks", "id");

  // Rename the new UUID column to id and set it as the primary key
  pgm.renameColumn("tasks", "id_uuid", "id");
  pgm.addConstraint("tasks", "tasks_pkey", {
    primaryKey: "id",
  });

  // Create the notes table
  pgm.createTable("notes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    text: {
      type: "text",
      notNull: true,
    },
    created_by_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    updated_by_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
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

  // Create the tasks_notes table
  pgm.createTable("tasks_notes", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    task_id: {
      type: "uuid",
      references: "tasks(id)",
      onDelete: "CASCADE",
    },
    note_id: {
      type: "uuid",
      references: "notes(id)",
      onDelete: "CASCADE",
    },
  });

  // Remove the comments column from the tasks table
  pgm.dropColumn("tasks", "comments");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Add the comments column back to the tasks table
  pgm.addColumn("tasks", {
    comments: {
      type: "text",
    },
  });

  // Drop the tasks_notes table
  pgm.dropTable("tasks_notes");

  // Drop the notes table
  pgm.dropTable("notes");

  // Revert the tasks table to the previous state with a numeric primary key
  pgm.dropConstraint("tasks", "tasks_pkey");
  pgm.addColumns("tasks", {
    id_number: {
      type: "serial",
      notNull: true,
    },
  });
  pgm.renameColumn("tasks", "id", "id_uuid");
  pgm.renameColumn("tasks", "id_number", "id");
  pgm.addConstraint("tasks", "tasks_pkey", {
    primaryKey: "id",
  });
  pgm.dropColumn("tasks", "id_uuid");
}
