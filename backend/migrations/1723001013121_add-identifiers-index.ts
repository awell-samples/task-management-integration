import { ColumnDefinitions, MigrationBuilder } from "node-pg-migrate";

export const shorthands: ColumnDefinitions | undefined = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createIndex("tasks", "identifiers", {
    method: "gin",
    name: "tasks_identifiers_idx",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("tasks", "tasks_identifiers_idx");
}
