-- CreateTable
CREATE TABLE `Benefit` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `serviceDomain` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Benefit_programId_idx`(`programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BenefitAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `programEnrollmentId` VARCHAR(191) NOT NULL,
    `benefitId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BenefitAssignment_programEnrollmentId_idx`(`programEnrollmentId`),
    INDEX `BenefitAssignment_benefitId_idx`(`benefitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Benefit` ADD CONSTRAINT `Benefit_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BenefitAssignment` ADD CONSTRAINT `BenefitAssignment_programEnrollmentId_fkey` FOREIGN KEY (`programEnrollmentId`) REFERENCES `ProgramEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BenefitAssignment` ADD CONSTRAINT `BenefitAssignment_benefitId_fkey` FOREIGN KEY (`benefitId`) REFERENCES `Benefit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
