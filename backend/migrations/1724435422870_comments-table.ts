import { MigrationBuilder, ColumnDefinitions } from "node-pg-migrate";
const COMMENTS_TABLE = {
  before: "notes",
  after: "comments",
  newColumns: {
    deleted_at: {
      type: "timestamp",
    },
    deleted_by_user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL",
    },
    // status should default to "active"
    status: {
      type: "text",
      default: "'active'",
      notNull: true,
    },
    // parent_id should be optional
    parent_id: {
      type: "uuid",
      references: "comments(id)",
      onDelete: "CASCADE",
    },
  } satisfies ColumnDefinitions,
};
const TASKS_COMMENTS_TABLE = {
  before: "tasks_notes",
  after: "tasks_comments",
  columnsToRename: [
    {
      before: "note_id",
      after: "comment_id",
    },
  ],
};
const constraints = [
  {
    newTableName: "comments",
    before: "notes_pkey",
    after: "comments_pkey",
  },
  {
    newTableName: "comments",
    before: "notes_created_by_user_id_fkey",
    after: "comments_created_by_user_id_fkey",
  },
  {
    newTableName: "comments",
    before: "notes_updated_by_user_id_fkey",
    after: "comments_updated_by_user_id_fkey",
  },
  {
    newTableName: "tasks_comments",
    before: "tasks_notes_pkey",
    after: "tasks_comments_pkey",
  },
  {
    newTableName: "tasks_comments",
    before: "tasks_notes_note_id_fkey",
    after: "tasks_comments_comment_id_fkey",
  },
];

/**
 * Renaming notes to comments, including all associated constraints and columns
 *
 * Note: I've been trying to think about readability with this migration.
 * It feels a touch overengineered... interested in your take.
 */
export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.renameTable(COMMENTS_TABLE.before, COMMENTS_TABLE.after);
  pgm.renameTable(TASKS_COMMENTS_TABLE.before, TASKS_COMMENTS_TABLE.after);
  pgm.addColumns(COMMENTS_TABLE.after, COMMENTS_TABLE.newColumns);

  TASKS_COMMENTS_TABLE.columnsToRename.forEach((column) => {
    pgm.renameColumn(TASKS_COMMENTS_TABLE.after, column.before, column.after);
  });

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
  TASKS_COMMENTS_TABLE.columnsToRename.forEach((column) => {
    pgm.renameColumn(TASKS_COMMENTS_TABLE.after, column.after, column.before);
  });

  pgm.dropColumns(COMMENTS_TABLE.after, Object.keys(COMMENTS_TABLE.newColumns));
  pgm.renameTable(COMMENTS_TABLE.after, COMMENTS_TABLE.before);
  pgm.renameTable(TASKS_COMMENTS_TABLE.after, TASKS_COMMENTS_TABLE.before);
}
