/*
  Warnings:

  - Changed the type of `type` on the `Mission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."MissionType" AS ENUM ('SOCIAL', 'TVL');

-- DropIndex
DROP INDEX "public"."Mission_type_key";

-- AlterTable
ALTER TABLE "public"."Mission" DROP COLUMN "type",
ADD COLUMN     "type" "public"."MissionType" NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "lineAccessToken" TEXT,
ADD COLUMN     "lineRefreshToken" TEXT;

-- CreateIndex
CREATE INDEX "CompletedMission_completedAt_idx" ON "public"."CompletedMission"("completedAt");

-- CreateIndex
CREATE INDEX "EventProcessed_blockNumber_idx" ON "public"."EventProcessed"("blockNumber");

-- CreateIndex
CREATE INDEX "LeaderboardEntry_score_idx" ON "public"."LeaderboardEntry"("score");

-- CreateIndex
CREATE INDEX "Mission_type_idx" ON "public"."Mission"("type");
