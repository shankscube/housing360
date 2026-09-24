-- CreateTable
CREATE TABLE `ReleaseOfInformation` (
    `id` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `recipientOrgName` VARCHAR(191) NOT NULL,
    `recipientContactName` VARCHAR(191) NULL,
    `recipientContactEmail` VARCHAR(191) NULL,
    `recipientContactPhone` VARCHAR(191) NULL,
    `infoCaseManagement` BOOLEAN NOT NULL DEFAULT false,
    `infoDayToDayActivity` BOOLEAN NOT NULL DEFAULT false,
    `infoMentalHealth` BOOLEAN NOT NULL DEFAULT false,
    `infoChemicalDependency` BOOLEAN NOT NULL DEFAULT false,
    `infoHivAids` BOOLEAN NOT NULL DEFAULT false,
    `infoOther` BOOLEAN NOT NULL DEFAULT false,
    `infoOtherSpecify` VARCHAR(191) NULL,
    `purpose` TEXT NULL,
    `clientSignature` LONGTEXT NULL,
    `clientSignedAt` DATETIME(3) NULL,
    `staffSignature` LONGTEXT NULL,
    `staffSignedAt` DATETIME(3) NULL,
    `expiresOn` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReleaseOfInformation_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ReleaseOfInformation` ADD CONSTRAINT `ReleaseOfInformation_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
