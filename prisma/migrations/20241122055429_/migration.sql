-- DropForeignKey
ALTER TABLE `Room` DROP FOREIGN KEY `Room_profileId_fkey`;

-- DropForeignKey
ALTER TABLE `RoomMember` DROP FOREIGN KEY `RoomMember_roomId_fkey`;

-- AddForeignKey
ALTER TABLE `Room` ADD CONSTRAINT `Room_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `Profile`(`profileId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoomMember` ADD CONSTRAINT `RoomMember_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`roomId`) ON DELETE CASCADE ON UPDATE CASCADE;
