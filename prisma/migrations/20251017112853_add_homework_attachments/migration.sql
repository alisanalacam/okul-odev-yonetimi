/*
  Warnings:

  - You are about to drop the `homework_photos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `homework_photos` DROP FOREIGN KEY `homework_photos_homework_id_fkey`;

-- DropTable
DROP TABLE `homework_photos`;

-- CreateTable
CREATE TABLE `homework_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `homework_id` INTEGER NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_type` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `homework_attachments` ADD CONSTRAINT `homework_attachments_homework_id_fkey` FOREIGN KEY (`homework_id`) REFERENCES `homeworks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
