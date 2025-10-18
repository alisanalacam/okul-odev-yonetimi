/*
  Warnings:

  - A unique constraint covering the columns `[one_signal_player_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `one_signal_player_id` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_one_signal_player_id_key` ON `users`(`one_signal_player_id`);
