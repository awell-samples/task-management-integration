import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Drop the indexes on identifiers columns if they exist
  pgm.dropIndex("tasks", "identifiers", {
    ifExists: true,
    name: "tasks_identifiers_idx",
  });

  pgm.dropIndex("patients", "identifiers", {
    ifExists: true,
    name: "patients_identifiers_idx",
  });

  // Create patients_identifiers table
  pgm.createTable("patients_identifiers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    patient_id: {
      type: "uuid",
      references: "patients(id)",
      onDelete: "CASCADE",
      notNull: true,
    },
    system: {
      type: "text",
      notNull: true,
    },
    value: {
      type: "text",
      notNull: true,
    },
  });
  pgm.addConstraint("patients_identifiers", "patients_identifiers_unique", {
    unique: ["system", "value"],
  });

  // Create tasks_identifiers table
  pgm.createTable("tasks_identifiers", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("uuid_generate_v4()"),
    },
    task_id: {
      type: "uuid",
      references: "tasks(id)",
      onDelete: "CASCADE",
      notNull: true,
    },
    system: {
      type: "text",
      notNull: true,
    },
    value: {
      type: "text",
      notNull: true,
    },
  });
  pgm.addConstraint("tasks_identifiers", "tasks_identifiers_unique", {
    unique: ["system", "value"],
  });

  // Remove identifiers column from tasks and patients tables
  pgm.dropColumn("patients", "identifiers");
  pgm.dropColumn("tasks", "identifiers");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Re-add the identifiers column to tasks and patients tables (if dropped)
  pgm.addColumn("patients", {
    identifiers: {
      type: "jsonb",
      default: "[]",
      notNull: true,
    },
  });
  pgm.addColumn("tasks", {
    identifiers: {
      type: "jsonb",
      default: "[]",
      notNull: true,
    },
  });

  // Drop the unique constraints and tables
  pgm.dropConstraint("patients_identifiers", "patients_identifiers_unique");
  pgm.dropTable("patients_identifiers");

  pgm.dropConstraint("tasks_identifiers", "tasks_identifiers_unique");
  pgm.dropTable("tasks_identifiers");

  pgm.createIndex("patients", "identifiers", {
    method: "gin",
    name: "patients_identifiers_idx",
  });

  pgm.createIndex("tasks", "identifiers", {
    method: "gin",
    name: "tasks_identifiers_idx",
  });
}
