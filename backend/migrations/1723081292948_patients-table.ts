import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create the patients table
  pgm.createTable("patients", {
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
    identifiers: {
      type: "jsonb",
      notNull: true,
      default: pgm.func("'[]'::jsonb"),
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

  pgm.createIndex("patients", "identifiers", {
    method: "gin",
    name: "patients_identifiers_idx",
  });

  pgm.addColumn("tasks", {
    patient_id: {
      type: "uuid",
      references: "patients(id)",
      onDelete: "SET NULL", // Set to null if the patient is deleted
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumn("tasks", "patient_id");
  pgm.dropIndex("patients", "patients_identifiers_idx");
  pgm.dropTable("patients");
}
