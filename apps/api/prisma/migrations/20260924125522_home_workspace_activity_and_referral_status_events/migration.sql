-- CreateTable
CREATE TABLE `ReferralStatusEvent` (
    `id` VARCHAR(191) NOT NULL,
    `referralId` VARCHAR(191) NOT NULL,
    `fromStatus` VARCHAR(191) NULL,
    `toStatus` VARCHAR(191) NOT NULL,
    `changedById` INTEGER NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `seenByReferrerAt` DATETIME(3) NULL,

    INDEX `ReferralStatusEvent_referralId_idx`(`referralId`),
    INDEX `ReferralStatusEvent_changedById_idx`(`changedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecordActivity` (
    `id` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `recordType` VARCHAR(191) NOT NULL,
    `recordId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RecordActivity_userId_idx`(`userId`),
    INDEX `RecordActivity_recordType_recordId_idx`(`recordType`, `recordId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReferralStatusEvent` ADD CONSTRAINT `ReferralStatusEvent_referralId_fkey` FOREIGN KEY (`referralId`) REFERENCES `Referral`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferralStatusEvent` ADD CONSTRAINT `ReferralStatusEvent_changedById_fkey` FOREIGN KEY (`changedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecordActivity` ADD CONSTRAINT `RecordActivity_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

