-- CreateTable
CREATE TABLE `ServiceDisbursement` (
    `id` VARCHAR(191) NOT NULL,
    `benefitAssignmentId` VARCHAR(191) NOT NULL,
    `recipientClientId` VARCHAR(191) NOT NULL,
    `disbursementType` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `disbursementDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` TEXT NULL,
    `triggerReason` VARCHAR(191) NULL,
    `voucherNumber` VARCHAR(191) NULL,
    `voucherAmount` DECIMAL(10, 2) NULL,
    `bedIdentifier` VARCHAR(191) NULL,
    `shift` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ServiceDisbursement_benefitAssignmentId_idx`(`benefitAssignmentId`),
    INDEX `ServiceDisbursement_recipientClientId_idx`(`recipientClientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Bed` (
    `id` VARCHAR(191) NOT NULL,
    `programId` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Bed_programId_idx`(`programId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BedAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `programEnrollmentId` VARCHAR(191) NOT NULL,
    `bedId` VARCHAR(191) NOT NULL,
    `shift` VARCHAR(191) NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BedAssignment_programEnrollmentId_idx`(`programEnrollmentId`),
    INDEX `BedAssignment_bedId_idx`(`bedId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BedNight` (
    `id` VARCHAR(191) NOT NULL,
    `bedAssignmentId` VARCHAR(191) NOT NULL,
    `logDate` DATE NOT NULL,
    `shift` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BedNight_bedAssignmentId_idx`(`bedAssignmentId`),
    UNIQUE INDEX `BedNight_bedAssignmentId_logDate_shift_key`(`bedAssignmentId`, `logDate`, `shift`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ServiceDisbursement` ADD CONSTRAINT `ServiceDisbursement_benefitAssignmentId_fkey` FOREIGN KEY (`benefitAssignmentId`) REFERENCES `BenefitAssignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ServiceDisbursement` ADD CONSTRAINT `ServiceDisbursement_recipientClientId_fkey` FOREIGN KEY (`recipientClientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Bed` ADD CONSTRAINT `Bed_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BedAssignment` ADD CONSTRAINT `BedAssignment_programEnrollmentId_fkey` FOREIGN KEY (`programEnrollmentId`) REFERENCES `ProgramEnrollment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BedAssignment` ADD CONSTRAINT `BedAssignment_bedId_fkey` FOREIGN KEY (`bedId`) REFERENCES `Bed`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BedNight` ADD CONSTRAINT `BedNight_bedAssignmentId_fkey` FOREIGN KEY (`bedAssignmentId`) REFERENCES `BedAssignment`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
