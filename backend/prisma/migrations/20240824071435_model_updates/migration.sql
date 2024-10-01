-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('active', 'resolved', 'deleted');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'stuck');

-- CreateTable
CREATE TABLE "comments" (
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

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients_identifiers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "patient_id" UUID NOT NULL,
    "system" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "patients_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pgmigrations" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "run_on" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "pgmigrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "due_at" TIMESTAMP(6),
    "task_type" VARCHAR(50),
    "task_data" JSONB,
    "status" "TaskStatus" DEFAULT 'pending',
    "priority" VARCHAR(50),
    "assigned_by" UUID,
    "completed_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "patient_id" UUID,
    "assigned_to_user_id" UUID,
    "assigned_by_user_id" UUID,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks_comments" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "task_id" UUID,
    "comment_id" UUID,

    CONSTRAINT "tasks_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks_identifiers" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "task_id" UUID NOT NULL,
    "system" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "tasks_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_identifiers_system_value_unique" ON "patients_identifiers"("system", "value");

-- CreateIndex
CREATE UNIQUE INDEX "tasks_identifiers_system_value_unique" ON "tasks_identifiers"("system", "value");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patients_identifiers" ADD CONSTRAINT "patients_identifiers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_by_user_id_fkey" FOREIGN KEY ("assigned_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_user_id_fkey" FOREIGN KEY ("assigned_to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks_comments" ADD CONSTRAINT "tasks_comments_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks_comments" ADD CONSTRAINT "tasks_comments_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks_identifiers" ADD CONSTRAINT "tasks_identifiers_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
