/*
  Warnings:

  - The `sbtTokenId` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "hasSbt" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "sbtTokenId",
ADD COLUMN     "sbtTokenId" BIGINT;
