-- AlterTable
ALTER TABLE `RoomMember` ADD COLUMN `sessionId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `RoomMember_sessionId_idx` ON `RoomMember`(`sessionId`);
