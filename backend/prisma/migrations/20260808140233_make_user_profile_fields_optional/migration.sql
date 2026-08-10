-- AlterTable
ALTER TABLE "user_profiles" ALTER COLUMN "first_name" DROP NOT NULL,
ALTER COLUMN "last_name" DROP NOT NULL,
ALTER COLUMN "display_name" DROP NOT NULL;
