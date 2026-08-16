/*
  Warnings:

  - The values [ISSUE_COMMENTED,ISSUE_MENTIONED,PROJECT_INVITATION,WORKSPACE_INVITATION,SYSTEM] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('WORKSPACE_MEMBER_ADDED', 'WORKSPACE_ROLE_CHANGED', 'PROJECT_MEMBER_ADDED', 'PROJECT_MEMBER_ROLE_CHANGED', 'PROJECT_MEMBER_REMOVED', 'PROJECT_MEMBER_LEFT', 'ISSUE_ASSIGNED', 'ISSUE_STATUS_CHANGED', 'COMMENT_ADDED', 'COMMENT_MENTION');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;
