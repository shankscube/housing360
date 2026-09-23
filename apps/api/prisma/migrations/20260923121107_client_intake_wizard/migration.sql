/*
  Warnings:

  - You are about to drop the column `isHeadOfHousehold` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `ssn` on the `Client` table. All the data in the column will be lost.
  - You are about to alter the column `raceEthnicity` on the `Client` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - Added the required column `firstName` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Client` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `Client_name_dob_idx` ON `Client`;

-- AlterTable
ALTER TABLE `Client` DROP COLUMN `isHeadOfHousehold`,
    DROP COLUMN `name`,
    DROP COLUMN `ssn`,
    ADD COLUMN `dischargeStatus` VARCHAR(191) NULL,
    ADD COLUMN `dobDataQuality` VARCHAR(191) NULL,
    ADD COLUMN `email` VARCHAR(191) NULL,
    ADD COLUMN `firstName` VARCHAR(191) NOT NULL,
    ADD COLUMN `koreanWar` BOOLEAN NULL,
    ADD COLUMN `lastName` VARCHAR(191) NOT NULL,
    ADD COLUMN `militaryBranch` VARCHAR(191) NULL,
    ADD COLUMN `mobile` VARCHAR(191) NULL,
    ADD COLUMN `nameDataQuality` VARCHAR(191) NULL,
    ADD COLUMN `otherTheater` BOOLEAN NULL,
    ADD COLUMN `relationshipToHoh` VARCHAR(191) NULL,
    ADD COLUMN `ssnDataQuality` VARCHAR(191) NULL,
    ADD COLUMN `ssnEncrypted` VARCHAR(255) NULL,
    ADD COLUMN `ssnHash` VARCHAR(191) NULL,
    ADD COLUMN `ssnLast4` VARCHAR(191) NULL,
    ADD COLUMN `title` VARCHAR(191) NULL,
    ADD COLUMN `veteranStatus` VARCHAR(191) NULL,
    ADD COLUMN `vietnamWar` BOOLEAN NULL,
    ADD COLUMN `ww2` BOOLEAN NULL,
    ADD COLUMN `yearEnteredService` INTEGER NULL,
    MODIFY `raceEthnicity` JSON NOT NULL,
    MODIFY `householdId` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Household` (
    `id` VARCHAR(191) NOT NULL,
    `headClientId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Household_headClientId_key`(`headClientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Program` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProgramEnrollment` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `householdId` VARCHAR(191) NULL,
    `programId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `relationshipToHoh` VARCHAR(191) NULL,
    `disablingCondition` VARCHAR(191) NULL,
    `enrollmentCoc` VARCHAR(191) NULL,
    `programCaseManagerId` VARCHAR(191) NULL,
    `isPrimary` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProgramEnrollment_clientId_idx`(`clientId`),
    INDEX `ProgramEnrollment_programId_idx`(`programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Case` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `programEnrollmentId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'open',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Case_clientId_programEnrollmentId_key`(`clientId`, `programEnrollmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Assessment` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `programEnrollmentId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `dataCollectionStage` INTEGER NOT NULL DEFAULT 1,
    `assessmentDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `status` VARCHAR(191) NOT NULL DEFAULT 'in_progress',
    `situationCategory` VARCHAR(191) NULL,
    `situation` VARCHAR(191) NULL,
    `locationDetails` VARCHAR(191) NULL,
    `leaseOwn60Day` VARCHAR(191) NULL,
    `leaveSituation14Days` VARCHAR(191) NULL,
    `monthsHomelessPast3Years` VARCHAR(191) NULL,
    `movedTwoOrMore` VARCHAR(191) NULL,
    `resourcesToObtain` VARCHAR(191) NULL,
    `stayLessThan7Nights` VARCHAR(191) NULL,
    `subsequentResidence` VARCHAR(191) NULL,
    `institutionalStayLessThan90Days` VARCHAR(191) NULL,
    `rentalSubsidyType` VARCHAR(191) NULL,
    `chronicHomelessness` VARCHAR(191) NULL,
    `nightBeforeStreetsEsSh` VARCHAR(191) NULL,
    `timesHomelessPast3Years` VARCHAR(191) NULL,
    `lengthOfStay` VARCHAR(191) NULL,
    `verifiedBy` VARCHAR(191) NULL,
    `incomeFromAnySource` VARCHAR(191) NULL,
    `earnedIncome` VARCHAR(191) NULL,
    `earnedIncomeAmount` DECIMAL(10, 2) NULL,
    `ssiIncome` VARCHAR(191) NULL,
    `ssiIncomeAmount` DECIMAL(10, 2) NULL,
    `ssdiIncome` VARCHAR(191) NULL,
    `ssdiIncomeAmount` DECIMAL(10, 2) NULL,
    `unemploymentIncome` VARCHAR(191) NULL,
    `unemploymentIncomeAmount` DECIMAL(10, 2) NULL,
    `vaServiceConnectedIncome` VARCHAR(191) NULL,
    `vaServiceConnectedIncomeAmount` DECIMAL(10, 2) NULL,
    `vaNonServiceIncome` VARCHAR(191) NULL,
    `vaNonServiceIncomeAmount` DECIMAL(10, 2) NULL,
    `privateDisabilityIncome` VARCHAR(191) NULL,
    `privateDisabilityIncomeAmount` DECIMAL(10, 2) NULL,
    `workersCompIncome` VARCHAR(191) NULL,
    `workersCompIncomeAmount` DECIMAL(10, 2) NULL,
    `tanfIncome` VARCHAR(191) NULL,
    `tanfIncomeAmount` DECIMAL(10, 2) NULL,
    `generalAssistanceIncome` VARCHAR(191) NULL,
    `generalAssistanceIncomeAmount` DECIMAL(10, 2) NULL,
    `socialSecurityRetirementIncome` VARCHAR(191) NULL,
    `socialSecurityRetirementIncomeAmount` DECIMAL(10, 2) NULL,
    `pensionIncome` VARCHAR(191) NULL,
    `pensionIncomeAmount` DECIMAL(10, 2) NULL,
    `childSupportIncome` VARCHAR(191) NULL,
    `childSupportIncomeAmount` DECIMAL(10, 2) NULL,
    `alimonyIncome` VARCHAR(191) NULL,
    `alimonyIncomeAmount` DECIMAL(10, 2) NULL,
    `otherIncome` VARCHAR(191) NULL,
    `otherIncomeAmount` DECIMAL(10, 2) NULL,
    `otherIncomeSpecify` VARCHAR(191) NULL,
    `benefitsFromAnySource` VARCHAR(191) NULL,
    `snapBenefit` VARCHAR(191) NULL,
    `wicBenefit` VARCHAR(191) NULL,
    `tanfChildCareBenefit` VARCHAR(191) NULL,
    `tanfTransportationBenefit` VARCHAR(191) NULL,
    `otherTanfBenefit` VARCHAR(191) NULL,
    `soarConnection` VARCHAR(191) NULL,
    `otherBenefitSource` VARCHAR(191) NULL,
    `otherBenefitSourceSpecify` VARCHAR(191) NULL,
    `insuranceFromAnySource` VARCHAR(191) NULL,
    `coveredByHealthInsurance` VARCHAR(191) NULL,
    `medicaid` VARCHAR(191) NULL,
    `medicaidNoReason` VARCHAR(191) NULL,
    `medicare` VARCHAR(191) NULL,
    `medicareNoReason` VARCHAR(191) NULL,
    `schip` VARCHAR(191) NULL,
    `schipNoReason` VARCHAR(191) NULL,
    `vha` VARCHAR(191) NULL,
    `vhaNoReason` VARCHAR(191) NULL,
    `employerInsurance` VARCHAR(191) NULL,
    `employerInsuranceNoReason` VARCHAR(191) NULL,
    `cobra` VARCHAR(191) NULL,
    `cobraNoReason` VARCHAR(191) NULL,
    `privatePayInsurance` VARCHAR(191) NULL,
    `privatePayInsuranceNoReason` VARCHAR(191) NULL,
    `stateInsurance` VARCHAR(191) NULL,
    `stateInsuranceNoReason` VARCHAR(191) NULL,
    `ihs` VARCHAR(191) NULL,
    `ihsNoReason` VARCHAR(191) NULL,
    `adap` VARCHAR(191) NULL,
    `adapNoReason` VARCHAR(191) NULL,
    `ryanWhite` VARCHAR(191) NULL,
    `ryanWhiteNoReason` VARCHAR(191) NULL,
    `otherInsurance` VARCHAR(191) NULL,
    `otherInsuranceNoReason` VARCHAR(191) NULL,
    `otherInsuranceSpecify` VARCHAR(191) NULL,
    `generalHealthStatus` VARCHAR(191) NULL,
    `dentalHealthStatus` VARCHAR(191) NULL,
    `mentalHealthStatus` VARCHAR(191) NULL,
    `pregnancyStatus` VARCHAR(191) NULL,
    `pregnancyDueDate` DATETIME(3) NULL,
    `domesticViolenceSurvivor` VARCHAR(191) NULL,
    `dvWhenOccurred` VARCHAR(191) NULL,
    `dvCurrentlyFleeing` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Assessment_programEnrollmentId_dataCollectionStage_key`(`programEnrollmentId`, `dataCollectionStage`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Disability` (
    `id` VARCHAR(191) NOT NULL,
    `assessmentId` VARCHAR(191) NOT NULL,
    `disabilityType` VARCHAR(191) NOT NULL,
    `response` VARCHAR(191) NOT NULL,
    `indefiniteAndImpairs` VARCHAR(191) NULL,
    `antiRetroviral` VARCHAR(191) NULL,
    `tCellAvailable` VARCHAR(191) NULL,
    `tCellCount` INTEGER NULL,
    `tCellSource` VARCHAR(191) NULL,
    `viralLoadAvailable` VARCHAR(191) NULL,
    `viralLoad` VARCHAR(191) NULL,
    `viralLoadSource` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Disability_assessmentId_idx`(`assessmentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InteractionSummary` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `meetingNotes` TEXT NULL,
    `nextSteps` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InteractionSummary_clientId_idx`(`clientId`),
    INDEX `InteractionSummary_caseId_idx`(`caseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Client_lastName_firstName_idx` ON `Client`(`lastName`, `firstName`);

-- CreateIndex
CREATE INDEX `Client_ssnHash_idx` ON `Client`(`ssnHash`);

-- CreateIndex
CREATE INDEX `Client_dob_idx` ON `Client`(`dob`);

-- AddForeignKey
ALTER TABLE `Client` ADD CONSTRAINT `Client_householdId_fkey` FOREIGN KEY (`householdId`) REFERENCES `Household`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Household` ADD CONSTRAINT `Household_headClientId_fkey` FOREIGN KEY (`headClientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramEnrollment` ADD CONSTRAINT `ProgramEnrollment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProgramEnrollment` ADD CONSTRAINT `ProgramEnrollment_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_programEnrollmentId_fkey` FOREIGN KEY (`programEnrollmentId`) REFERENCES `ProgramEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assessment` ADD CONSTRAINT `Assessment_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assessment` ADD CONSTRAINT `Assessment_programEnrollmentId_fkey` FOREIGN KEY (`programEnrollmentId`) REFERENCES `ProgramEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Assessment` ADD CONSTRAINT `Assessment_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Disability` ADD CONSTRAINT `Disability_assessmentId_fkey` FOREIGN KEY (`assessmentId`) REFERENCES `Assessment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InteractionSummary` ADD CONSTRAINT `InteractionSummary_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InteractionSummary` ADD CONSTRAINT `InteractionSummary_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
