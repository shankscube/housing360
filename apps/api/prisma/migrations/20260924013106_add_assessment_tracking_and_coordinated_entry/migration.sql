-- AlterTable
ALTER TABLE `Assessment` ADD COLUMN `cycleNumber` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `dueDate` DATETIME(3) NULL,
    ADD COLUMN `score` INTEGER NULL,
    ADD COLUMN `scoreLabel` VARCHAR(191) NULL,
    ADD COLUMN `type` VARCHAR(191) NULL;

-- Backfill: every existing Assessment row predates this change and is an
-- Entry-stage record (this phase only ever wrote dataCollectionStage = 1).
UPDATE `Assessment` SET `type` = 'entry' WHERE `dataCollectionStage` = 1 AND `type` IS NULL;

-- CreateTable
CREATE TABLE `VulnerabilityAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `answers` JSON NOT NULL,
    `score` INTEGER NOT NULL,
    `priorityTier` VARCHAR(191) NOT NULL,
    `safetyAlert` BOOLEAN NOT NULL DEFAULT false,
    `assessedById` INTEGER NOT NULL,
    `referralId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `VulnerabilityAssessment_referralId_key`(`referralId`),
    INDEX `VulnerabilityAssessment_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
-- Created before the old 2-column index is dropped below so the
-- `programEnrollmentId` foreign key stays covered by an index at every point
-- (MySQL error 1553 otherwise: it refuses to drop an index still backing an FK).
CREATE UNIQUE INDEX `Assessment_programEnrollmentId_dataCollectionStage_cycleNumb_key` ON `Assessment`(`programEnrollmentId`, `dataCollectionStage`, `cycleNumber`);

-- DropIndex
DROP INDEX `Assessment_programEnrollmentId_dataCollectionStage_key` ON `Assessment`;

-- AddForeignKey
ALTER TABLE `VulnerabilityAssessment` ADD CONSTRAINT `VulnerabilityAssessment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VulnerabilityAssessment` ADD CONSTRAINT `VulnerabilityAssessment_assessedById_fkey` FOREIGN KEY (`assessedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `VulnerabilityAssessment` ADD CONSTRAINT `VulnerabilityAssessment_referralId_fkey` FOREIGN KEY (`referralId`) REFERENCES `Referral`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
