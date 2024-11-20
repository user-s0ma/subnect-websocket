/*
  Warnings:

  - You are about to drop the column `senderId` on the `MessageHidden` table. All the data in the column will be lost.
  - You are about to drop the `AdHeader` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[profileId,receiverId]` on the table `MessageHidden` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `receiverId` to the `MessageHidden` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `AdHeader` DROP FOREIGN KEY `AdHeader_assetId_fkey`;

-- DropForeignKey
ALTER TABLE `AdHeader` DROP FOREIGN KEY `AdHeader_profileId_fkey`;

-- DropForeignKey
ALTER TABLE `AdHeader` DROP FOREIGN KEY `AdHeader_urlId_fkey`;

-- DropForeignKey
ALTER TABLE `MessageHidden` DROP FOREIGN KEY `MessageHidden_senderId_fkey`;

-- DropIndex
DROP INDEX `MessageHidden_profileId_senderId_key` ON `MessageHidden`;

-- AlterTable
ALTER TABLE `MessageHidden` DROP COLUMN `senderId`,
    ADD COLUMN `receiverId` VARCHAR(191) NOT NULL;

-- DropTable
DROP TABLE `AdHeader`;

-- CreateTable
CREATE TABLE `Room` (
    `roomId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`roomId`)
);

-- CreateTable
CREATE TABLE `RoomMember` (
    `profileId` VARCHAR(191) NOT NULL,
    `roomId` VARCHAR(191) NOT NULL,
    `speaker` BOOLEAN NOT NULL DEFAULT false,
    `mute` BOOLEAN NOT NULL DEFAULT true,

    INDEX `RoomMember_roomId_idx`(`roomId`),
    UNIQUE INDEX `RoomMember_profileId_roomId_key`(`profileId`, `roomId`)
);

-- CreateIndex
CREATE INDEX `MessageHidden_receiverId_idx` ON `MessageHidden`(`receiverId`);

-- CreateIndex
CREATE UNIQUE INDEX `MessageHidden_profileId_receiverId_key` ON `MessageHidden`(`profileId`, `receiverId`);

-- AddForeignKey
ALTER TABLE `MessageHidden` ADD CONSTRAINT `MessageHidden_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `Profile`(`profileId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomMember` ADD CONSTRAINT `RoomMember_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`profileId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomMember` ADD CONSTRAINT `RoomMember_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`roomId`) ON DELETE RESTRICT ON UPDATE CASCADE;
