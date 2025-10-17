/*
  Warnings:

  - You are about to drop the column `photo_url` on the `announcements` table. All the data in the column will be lost.
  - You are about to drop the column `image_url` on the `homeworks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `announcements` DROP COLUMN `photo_url`;

-- AlterTable
ALTER TABLE `homeworks` DROP COLUMN `image_url`;

-- CreateTable
CREATE TABLE `homework_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `homework_id` INTEGER NOT NULL,
    `photo_url` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `announcement_photos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `announcement_id` INTEGER NOT NULL,
    `photo_url` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `homework_photos` ADD CONSTRAINT `homework_photos_homework_id_fkey` FOREIGN KEY (`homework_id`) REFERENCES `homeworks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `announcement_photos` ADD CONSTRAINT `announcement_photos_announcement_id_fkey` FOREIGN KEY (`announcement_id`) REFERENCES `announcements`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
