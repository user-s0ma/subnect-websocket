-- Step 1: First drop all foreign keys to avoid constraint violations
ALTER TABLE `AdPost` DROP FOREIGN KEY `AdPost_urlId_fkey`;
ALTER TABLE `AdUrlView` DROP FOREIGN KEY `AdUrlView_profileId_fkey`;
ALTER TABLE `AdUrlView` DROP FOREIGN KEY `AdUrlView_urlId_fkey`;

-- Step 2: Set AdPost.urlId to NULL since we don't need the old references
UPDATE `AdPost` SET `urlId` = NULL;

-- Step 3: Drop old tables
DROP TABLE `AdUrl`;
DROP TABLE `AdUrlView`;

-- Step 4: Add profileId to Room
ALTER TABLE `Room` ADD COLUMN `profileId` VARCHAR(191) NOT NULL;

-- Step 5: Create new tables
CREATE TABLE `Url` (
    `urlId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Url_urlId_idx`(`urlId`),
    PRIMARY KEY (`urlId`)
);

CREATE TABLE `UrlView` (
    `viewId` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NULL,
    `urlId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UrlView_profileId_idx`(`profileId`),
    INDEX `UrlView_urlId_idx`(`urlId`),
    INDEX `UrlView_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`viewId`)
);

-- Step 6: Add new foreign keys
ALTER TABLE `Room` ADD CONSTRAINT `Room_profileId_fkey` 
    FOREIGN KEY (`profileId`) REFERENCES `Profile`(`profileId`) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `UrlView` ADD CONSTRAINT `UrlView_profileId_fkey` 
    FOREIGN KEY (`profileId`) REFERENCES `Profile`(`profileId`) 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UrlView` ADD CONSTRAINT `UrlView_urlId_fkey` 
    FOREIGN KEY (`urlId`) REFERENCES `Url`(`urlId`) 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `AdPost` ADD CONSTRAINT `AdPost_urlId_fkey` 
    FOREIGN KEY (`urlId`) REFERENCES `Url`(`urlId`) 
    ON DELETE SET NULL ON UPDATE CASCADE;