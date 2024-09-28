/*
  Warnings:

  - You are about to drop the `tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TaskAssignment" DROP CONSTRAINT "TaskAssignment_task_id_fkey";

-- DropForeignKey
ALTER TABLE "task_comments" DROP CONSTRAINT "tasks_comments_task_id_fkey";

-- DropForeignKey
ALTER TABLE "task_identifiers" DROP CONSTRAINT "task_identifiers_task_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_patient_id_fkey";

-- DropTable
DROP TABLE "tasks";

-- CreateTable
CREATE TABLE "task" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "due_at" TIMESTAMP(6),
    "task_type" VARCHAR(50),
    "task_data" JSONB,
    "status" "TaskStatus" DEFAULT 'pending',
    "priority" VARCHAR(50),
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "patient_id" UUID,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "tasks_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_identifiers" ADD CONSTRAINT "task_identifiers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task" ADD CONSTRAINT "tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
