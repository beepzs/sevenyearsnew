-- CreateTable
CREATE TABLE IF NOT EXISTS `books` (
    `id` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` TEXT NULL,
    `eyebrow` TEXT NULL,
    `author` VARCHAR(191) NULL,
    `author_role` VARCHAR(191) NULL DEFAULT 'Co-host · Functional medicine',
    `author_image` LONGTEXT NULL,
    `approver1_name` VARCHAR(191) NULL DEFAULT 'Dr. Bill Sears',
    `approver1_role` VARCHAR(191) NULL DEFAULT 'Pediatrician · Author · Featured expert',
    `approver1_image` LONGTEXT NULL,
    `approver2_name` VARCHAR(191) NULL DEFAULT 'Dr. Murray Clarke',
    `approver2_role` VARCHAR(191) NULL DEFAULT 'Host · The First Seven Years',
    `approver2_image` LONGTEXT NULL,
    `approved_by` VARCHAR(191) NULL,
    `description` LONGTEXT NULL,
    `note` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'In Production',
    `publisher` VARCHAR(191) NULL,
    `published` BOOLEAN NOT NULL DEFAULT true,
    `is_featured` BOOLEAN NOT NULL DEFAULT false,
    `order` INTEGER NOT NULL DEFAULT 0,
    `cover_type` VARCHAR(191) NULL DEFAULT 'concept',
    `cover_image` LONGTEXT NULL,
    `preorder_url` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `books_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE IF NOT EXISTS `book_waitlist` (
    `id` VARCHAR(191) NOT NULL,
    `book_id` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `book_waitlist` ADD CONSTRAINT `book_waitlist_book_id_fkey` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
