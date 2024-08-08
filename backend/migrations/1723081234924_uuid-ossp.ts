import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Enable the uuid-ossp extension
  pgm.createExtension("uuid-ossp", { ifNotExists: true });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  // Drop the uuid-ossp extension
  pgm.dropExtension("uuid-ossp", { ifExists: true });
}
