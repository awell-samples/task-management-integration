/*
  Warnings:

  - You are about to drop the column `assigned_by_user_id` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the column `assigned_to_user_id` on the `tasks` table. All the data in the column will be lost.
  - You are about to drop the `comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patients` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `patients_identifiers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tasks_comments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tasks_identifiers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_created_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_deleted_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_id_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_updated_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "patients_identifiers" DROP CONSTRAINT "patients_identifiers_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_by_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_to_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_patient_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks_comments" DROP CONSTRAINT "tasks_comments_comment_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks_comments" DROP CONSTRAINT "tasks_comments_task_id_fkey";

-- DropForeignKey
ALTER TABLE "tasks_identifiers" DROP CONSTRAINT "tasks_identifiers_task_id_fkey";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "assigned_by_user_id",
DROP COLUMN "assigned_to_user_id";

-- DropTable
DROP TABLE "comments";

-- DropTable
DROP TABLE "patients";

-- DropTable
DROP TABLE "patients_identifiers";

-- DropTable
DROP TABLE "tasks_comments";

-- DropTable
DROP TABLE "tasks_identifiers";

-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "comment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "text" TEXT NOT NULL,
    "created_by_user_id" UUID,
    "updated_by_user_id" UUID,
    "deleted_by_user_id" UUID,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(6),
    "CommentStatus" VARCHAR(50) NOT NULL DEFAULT 'active',
    "parent_id" UUID,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_identifiers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patient_id" UUID NOT NULL,
    "system" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "patient_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignment" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "task_id" UUID NOT NULL,
    "assigned_by_user_id" UUID,
    "assigned_to_user_id" UUID,

    CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_comments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "task_id" UUID,
    "comment_id" UUID,

    CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_identifiers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "task_id" UUID NOT NULL,
    "system" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "task_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_identifiers_system_value_unique" ON "patient_identifiers"("system", "value");

-- CreateIndex
CREATE UNIQUE INDEX "task_identifiers_system_value_unique" ON "task_identifiers"("system", "value");

-- CreateIndex
CREATE UNIQUE INDEX "user_id_key" ON "user"("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patient_identifiers" ADD CONSTRAINT "patient_identifiers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patient"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_comments" ADD CONSTRAINT "tasks_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_identifiers" ADD CONSTRAINT "task_identifiers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
