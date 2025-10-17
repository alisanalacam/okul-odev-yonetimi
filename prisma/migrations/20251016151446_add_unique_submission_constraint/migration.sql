/*
  Warnings:

  - A unique constraint covering the columns `[student_id,homework_id]` on the table `homework_submissions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `homework_submissions_student_id_homework_id_key` ON `homework_submissions`(`student_id`, `homework_id`);
