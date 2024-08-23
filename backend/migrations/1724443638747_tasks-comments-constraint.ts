import { MigrationBuilder } from "node-pg-migrate";

const constraints = [
  {
    newTableName: "tasks_comments",
    before: "tasks_notes_task_id_fkey",
    after: "tasks_comments_task_id_fkey",
  },
];

/**
 * Renaming notes to comments, including all associated constraints and columns
 *
 * Note: I've been trying to think about readability with this migration.
 * It feels a touch overengineered... interested in your take.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  constraints.forEach((constraint) => {
    pgm.renameConstraint(
      constraint.newTableName,
      constraint.before,
      constraint.after,
    );
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  constraints.forEach((constraint) => {
    pgm.renameConstraint(
      constraint.newTableName,
      constraint.after,
      constraint.before,
    );
  });
}
