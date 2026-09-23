-- CreateTable
CREATE TABLE `Client` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `sex` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL,
    `raceEthnicity` VARCHAR(191) NOT NULL,
    `ssn` VARCHAR(191) NULL,
    `ssnDisclosure` ENUM('PROVIDED', 'CLIENT_DOESNT_KNOW', 'PREFERS_NOT_TO_ANSWER', 'DATA_NOT_COLLECTED') NOT NULL,
    `dob` VARCHAR(191) NULL,
    `dobDisclosure` ENUM('PROVIDED', 'CLIENT_DOESNT_KNOW', 'PREFERS_NOT_TO_ANSWER', 'DATA_NOT_COLLECTED') NOT NULL,
    `householdId` VARCHAR(191) NOT NULL,
    `isHeadOfHousehold` BOOLEAN NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Client_householdId_idx`(`householdId`),
    INDEX `Client_name_dob_idx`(`name`, `dob`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
