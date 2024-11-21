-- Step 1: Add nullable ID columns first
ALTER TABLE `Block` ADD COLUMN `blockId` VARCHAR(191);
ALTER TABLE `Bookmark` ADD COLUMN `bookmarkId` VARCHAR(191);
ALTER TABLE `Follow` ADD COLUMN `followId` VARCHAR(191);
ALTER TABLE `ListFollow` ADD COLUMN `followId` VARCHAR(191);
ALTER TABLE `ListMember` ADD COLUMN `memberId` VARCHAR(191);
ALTER TABLE `RoomMember` ADD COLUMN `memberId` VARCHAR(191);

-- Step 2: Generate UUIDs for existing rows
UPDATE `Block` SET `blockId` = UUID() WHERE `blockId` IS NULL;
UPDATE `Bookmark` SET `bookmarkId` = UUID() WHERE `bookmarkId` IS NULL;
UPDATE `Follow` SET `followId` = UUID() WHERE `followId` IS NULL;
UPDATE `ListFollow` SET `followId` = UUID() WHERE `followId` IS NULL;
UPDATE `ListMember` SET `memberId` = UUID() WHERE `memberId` IS NULL;
UPDATE `RoomMember` SET `memberId` = UUID() WHERE `memberId` IS NULL;

-- Step 3: Make the columns NOT NULL after populating them
ALTER TABLE `Block` MODIFY COLUMN `blockId` VARCHAR(191) NOT NULL;
ALTER TABLE `Bookmark` MODIFY COLUMN `bookmarkId` VARCHAR(191) NOT NULL;
ALTER TABLE `Follow` MODIFY COLUMN `followId` VARCHAR(191) NOT NULL;
ALTER TABLE `ListFollow` MODIFY COLUMN `followId` VARCHAR(191) NOT NULL;
ALTER TABLE `ListMember` MODIFY COLUMN `memberId` VARCHAR(191) NOT NULL;
ALTER TABLE `RoomMember` MODIFY COLUMN `memberId` VARCHAR(191) NOT NULL;

-- Step 4: Add primary keys
ALTER TABLE `Block` ADD PRIMARY KEY (`blockId`);
ALTER TABLE `Bookmark` ADD PRIMARY KEY (`bookmarkId`);
ALTER TABLE `Follow` ADD PRIMARY KEY (`followId`);
ALTER TABLE `ListFollow` ADD PRIMARY KEY (`followId`);
ALTER TABLE `ListMember` ADD PRIMARY KEY (`memberId`);
ALTER TABLE `RoomMember` ADD PRIMARY KEY (`memberId`);
