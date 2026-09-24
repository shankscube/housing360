-- CreateTable
CREATE TABLE `CarePlanTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `isPublished` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CarePlanTemplateGoal` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `priority` VARCHAR(191) NULL,
    `serviceDomain` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CarePlanTemplateGoal_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CarePlanTemplateTask` (
    `id` VARCHAR(191) NOT NULL,
    `templateGoalId` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CarePlanTemplateTask_templateGoalId_idx`(`templateGoalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoalDefinition` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `serviceDomain` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CarePlan` (
    `id` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Proposed',
    `startDate` DATETIME(3) NULL,
    `endDate` DATETIME(3) NULL,
    `templateId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CarePlan_caseId_idx`(`caseId`),
    INDEX `CarePlan_clientId_idx`(`clientId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GoalAssignment` (
    `id` VARCHAR(191) NOT NULL,
    `carePlanId` VARCHAR(191) NOT NULL,
    `goalDefinitionId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `priority` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'Not Started',
    `serviceDomain` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `GoalAssignment_carePlanId_idx`(`carePlanId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `contactEmail` VARCHAR(191) NULL,
    `isPartner` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationServiceDomain` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `serviceDomain` VARCHAR(191) NOT NULL,

    INDEX `OrganizationServiceDomain_organizationId_idx`(`organizationId`),
    UNIQUE INDEX `OrganizationServiceDomain_organizationId_serviceDomain_key`(`organizationId`, `serviceDomain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Referral` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `clientId` VARCHAR(191) NOT NULL,
    `caseId` VARCHAR(191) NULL,
    `programId` VARCHAR(191) NULL,
    `providerOrgId` VARCHAR(191) NULL,
    `referrerOrgId` VARCHAR(191) NULL,
    `referralDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `priority` VARCHAR(191) NULL,
    `category` VARCHAR(191) NULL,
    `outcome` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `comments` TEXT NULL,
    `clientContact` VARCHAR(191) NULL,
    `providerContact` VARCHAR(191) NULL,
    `referrerContact` VARCHAR(191) NULL,
    `caseManagerComments` TEXT NULL,
    `declineReason` VARCHAR(191) NULL,
    `declineNotes` TEXT NULL,
    `isExternal` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Referral_clientId_idx`(`clientId`),
    INDEX `Referral_caseId_idx`(`caseId`),
    INDEX `Referral_providerOrgId_idx`(`providerOrgId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Case` ADD CONSTRAINT `Case_referralId_fkey` FOREIGN KEY (`referralId`) REFERENCES `Referral`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_goalAssignmentId_fkey` FOREIGN KEY (`goalAssignmentId`) REFERENCES `GoalAssignment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarePlanTemplateGoal` ADD CONSTRAINT `CarePlanTemplateGoal_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `CarePlanTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarePlanTemplateTask` ADD CONSTRAINT `CarePlanTemplateTask_templateGoalId_fkey` FOREIGN KEY (`templateGoalId`) REFERENCES `CarePlanTemplateGoal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarePlan` ADD CONSTRAINT `CarePlan_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarePlan` ADD CONSTRAINT `CarePlan_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CarePlan` ADD CONSTRAINT `CarePlan_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `CarePlanTemplate`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoalAssignment` ADD CONSTRAINT `GoalAssignment_carePlanId_fkey` FOREIGN KEY (`carePlanId`) REFERENCES `CarePlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GoalAssignment` ADD CONSTRAINT `GoalAssignment_goalDefinitionId_fkey` FOREIGN KEY (`goalDefinitionId`) REFERENCES `GoalDefinition`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationServiceDomain` ADD CONSTRAINT `OrganizationServiceDomain_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `Client`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_caseId_fkey` FOREIGN KEY (`caseId`) REFERENCES `Case`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_programId_fkey` FOREIGN KEY (`programId`) REFERENCES `Program`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_providerOrgId_fkey` FOREIGN KEY (`providerOrgId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Referral` ADD CONSTRAINT `Referral_referrerOrgId_fkey` FOREIGN KEY (`referrerOrgId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
