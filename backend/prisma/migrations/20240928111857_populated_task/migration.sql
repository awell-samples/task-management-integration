/*
  Warnings:

  - You are about to drop the column `assigned_by` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "assigned_by",
ADD COLUMN     "patientId" UUID;
