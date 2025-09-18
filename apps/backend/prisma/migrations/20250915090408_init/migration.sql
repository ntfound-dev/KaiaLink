/*
  Warnings:

  - A unique constraint covering the columns `[telegramLinkToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "discordAccessToken" TEXT,
ADD COLUMN     "telegramId" TEXT,
ADD COLUMN     "telegramLinkToken" TEXT,
ADD COLUMN     "telegramTokenExpiry" TIMESTAMP(3),
ADD COLUMN     "xAccessToken" TEXT,
ADD COLUMN     "xId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramLinkToken_key" ON "public"."User"("telegramLinkToken");
