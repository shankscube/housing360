-- AlterTable
ALTER TABLE `Case` ADD COLUMN `closedAt` DATETIME(3) NULL,
    ADD COLUMN `contact` VARCHAR(191) NULL,
    ADD COLUMN `createdById` INTEGER NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `escalated` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `followUpDueDate` DATETIME(3) NULL,
    ADD COLUMN `followUpMilestone` VARCHAR(191) NOT NULL DEFAULT 'none',
    ADD COLUMN `hmisDataQualityStatus` VARCHAR(191) NULL,
    ADD COLUMN `nextHmisReviewDue` DATETIME(3) NULL,
    ADD COLUMN `openedDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `origin` VARCHAR(191) NULL,
    ADD COLUMN `referralId` VARCHAR(191) NULL,
    ADD COLUMN `stage` VARCHAR(191) NULL,
    ADD COLUMN `updatedById` INTEGER NULL;

-- AlterTable
ALTER TABLE `InteractionSummary` ADD COLUMN `confidentialityType` VARCHAR(191) NULL,
    ADD COLUMN `interactionPurpose` VARCHAR(191) NULL,
    ADD COLUMN `offering` VARCHAR(191) NULL,
    ADD COLUMN `partnerAccount` VARCHAR(191) NULL,
    ADD COLUMN `relatedRecordId` VARCHAR(191) NULL,
    ADD COLUMN `relatedRecordType` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Task` (
    `id` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `priority` VARCHAR(191) NULL,
    `subtype` VARCHAR(191) NULL,
    `dueDate` DATETIME(3) NULL,
    `ownerId` INTEGER NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NULL,
    `goalAssignmentId` VARCHAR(191) NULL,
    `interactionSummaryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Task_clientId_idx`(`clientId`),
    INDEX `Task_caseId_idx`(`caseId`),
    INDEX `Task_goalAssignmentId_idx`(`goalAssignmentId`),
    INDEX `Task_interactionSummaryId_idx`(`interactionSummaryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Case_referralId_idx` ON `Case`(`referralId`);

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_interactionSummaryId_fkey` FOREIGN KEY (`interactionSummaryId`) REFERENCES `InteractionSummary`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
