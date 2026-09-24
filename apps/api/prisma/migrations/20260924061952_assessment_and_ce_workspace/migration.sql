-- DropForeignKey
ALTER TABLE `VulnerabilityAssessment` DROP FOREIGN KEY `VulnerabilityAssessment_assessedById_fkey`;

-- DropForeignKey
ALTER TABLE `VulnerabilityAssessment` DROP FOREIGN KEY `VulnerabilityAssessment_clientId_fkey`;

-- DropForeignKey
ALTER TABLE `VulnerabilityAssessment` DROP FOREIGN KEY `VulnerabilityAssessment_referralId_fkey`;

-- AlterTable
ALTER TABLE `Assessment` ADD COLUMN `assessorId` INTEGER NULL,
    ADD COLUMN `legacySyncDate` DATETIME(3) NULL,
    ADD COLUMN `legacySyncStatus` VARCHAR(191) NOT NULL DEFAULT 'not_synced';

-- AlterTable
ALTER TABLE `Program` ADD COLUMN `operatingOrganizationId` VARCHAR(191) NULL,
    ADD COLUMN `projectTypeCode` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ProgramEnrollment` ADD COLUMN `endDate` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'case_manager';

-- DropTable
DROP TABLE `VulnerabilityAssessment`;

-- CreateTable
CREATE TABLE `ProgramExit` (
    `id` VARCHAR(191) NOT NULL,
    `programEnrollmentId` VARCHAR(191) NOT NULL,
    `assessmentId` VARCHAR(191) NOT NULL,
    `exitDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `destinationType` VARCHAR(191) NULL,
    `destination` VARCHAR(191) NULL,
    `caseManagerExitReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ProgramExit_assessmentId_key`(`assessmentId`),
    INDEX `ProgramExit_programEnrollmentId_idx`(`programEnrollmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AssessmentScoreContribution` (
    `id` VARCHAR(191) NOT NULL,
    `assessmentId` VARCHAR(191) NOT NULL,
    `field` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NULL,
    `contribution` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AssessmentScoreContribution_assessmentId_idx`(`assessmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ScoringRule` (
    `id` VARCHAR(191) NOT NULL,
    `field` VARCHAR(191) NOT NULL,
    `matchValue` VARCHAR(191) NULL,
    `rangeMin` DECIMAL(10, 2) NULL,
    `rangeMax` DECIMAL(10, 2) NULL,
    `contribution` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ScoringRule_field_idx`(`field`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CarePlanTemplateRule` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `scoreBandMin` INTEGER NULL,
    `scoreBandMax` INTEGER NULL,
    `fieldCondition` VARCHAR(191) NULL,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CarePlanTemplateRule_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CeQuestion` (
    `id` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `clientFacingPrompt` TEXT NULL,
    `sequence` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `weightNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CeQuestion_sequence_idx`(`sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CeAnswerOption` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CeAnswerOption_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CeScoreBand` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `minScore` INTEGER NOT NULL,
    `maxScore` INTEGER NOT NULL,
    `description` TEXT NULL,
    `badgeColor` VARCHAR(191) NULL,
    `recommendedProjectTypeCodes` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CeFlagOverride` (
    `id` VARCHAR(191) NOT NULL,
    `flag` VARCHAR(191) NOT NULL,
    `triggerQuestionId` VARCHAR(191) NULL,
    `triggerMinScore` INTEGER NULL,
    `behavior` VARCHAR(191) NOT NULL,
    `externalReferralMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CeRuleChange` (
    `id` VARCHAR(191) NOT NULL,
    `ruleTable` VARCHAR(191) NOT NULL,
    `ruleId` VARCHAR(191) NOT NULL,
    `actorId` INTEGER NOT NULL,
    `before` JSON NULL,
    `after` JSON NULL,
    `changedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CeRuleChange_ruleTable_ruleId_idx`(`ruleTable`, `ruleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CeAssessment` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `assessedById` INTEGER NOT NULL,
    `assessedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `totalScore` INTEGER NOT NULL,
    `bandId` VARCHAR(191) NULL,
    `flags` JSON NOT NULL,
    `referralId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CeAssessment_referralId_key`(`referralId`),
    INDEX `CeAssessment_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CeResponse` (
    `id` VARCHAR(191) NOT NULL,
    `ceAssessmentId` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `answerOptionId` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL,

    INDEX `CeResponse_ceAssessmentId_idx`(`ceAssessmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Program_operatingOrganizationId_idx` ON `Program`(`operatingOrganizationId`);

-- AddForeignKey
ALTER TABLE `Program` ADD CONSTRAINT `Program_operatingOrganizationId_fkey` FOREIGN KEY (`operatingOrganizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assessment` ADD CONSTRAINT `Assessment_assessorId_fkey` FOREIGN KEY (`assessorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramExit` ADD CONSTRAINT `ProgramExit_programEnrollmentId_fkey` FOREIGN KEY (`programEnrollmentId`) REFERENCES `ProgramEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramExit` ADD CONSTRAINT `ProgramExit_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `Assessment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AssessmentScoreContribution` ADD CONSTRAINT `AssessmentScoreContribution_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `Assessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarePlanTemplateRule` ADD CONSTRAINT `CarePlanTemplateRule_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `CarePlanTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeAnswerOption` ADD CONSTRAINT `CeAnswerOption_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `CeQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeFlagOverride` ADD CONSTRAINT `CeFlagOverride_triggerQuestionId_fkey` FOREIGN KEY (`triggerQuestionId`) REFERENCES `CeQuestion`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeRuleChange` ADD CONSTRAINT `CeRuleChange_actorId_fkey` FOREIGN KEY (`actorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeAssessment` ADD CONSTRAINT `CeAssessment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeAssessment` ADD CONSTRAINT `CeAssessment_assessedById_fkey` FOREIGN KEY (`assessedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeAssessment` ADD CONSTRAINT `CeAssessment_bandId_fkey` FOREIGN KEY (`bandId`) REFERENCES `CeScoreBand`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeAssessment` ADD CONSTRAINT `CeAssessment_referralId_fkey` FOREIGN KEY (`referralId`) REFERENCES `Referral`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeResponse` ADD CONSTRAINT `CeResponse_ceAssessmentId_fkey` FOREIGN KEY (`ceAssessmentId`) REFERENCES `CeAssessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeResponse` ADD CONSTRAINT `CeResponse_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `CeQuestion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CeResponse` ADD CONSTRAINT `CeResponse_answerOptionId_fkey` FOREIGN KEY (`answerOptionId`) REFERENCES `CeAnswerOption`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

