/*
  Warnings:

  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `RoomMember` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Room` DROP FOREIGN KEY `Room_profileId_fkey`;

-- DropForeignKey
ALTER TABLE `RoomMember` DROP FOREIGN KEY `RoomMember_profileId_fkey`;

-- DropForeignKey
ALTER TABLE `RoomMember` DROP FOREIGN KEY `RoomMember_roomId_fkey`;

-- DropTable
DROP TABLE `Room`;

-- DropTable
DROP TABLE `RoomMember`;
