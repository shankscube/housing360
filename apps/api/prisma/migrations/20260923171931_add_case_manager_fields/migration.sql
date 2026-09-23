-- AlterTable
ALTER TABLE `Case` ADD COLUMN `assignedCaseManagerId` INTEGER NULL,
    ADD COLUMN `caseNumber` VARCHAR(191) NOT NULL,
    ADD COLUMN `lastContactDate` DATETIME(3) NULL,
    ADD COLUMN `priority` VARCHAR(191) NULL,
    ADD COLUMN `subject` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Case_caseNumber_key` ON `Case`(`caseNumber`);

-- CreateIndex
CREATE INDEX `Case_assignedCaseManagerId_idx` ON `Case`(`assignedCaseManagerId`);

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_assignedCaseManagerId_fkey` FOREIGN KEY (`assignedCaseManagerId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
