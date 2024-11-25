/*
  Warnings:

  - You are about to drop the column `mute` on the `RoomMember` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `RoomMember_sessionId_idx` ON `RoomMember`;

-- AlterTable
ALTER TABLE `RoomMember` DROP COLUMN `mute`;
