-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."MissionType" ADD VALUE 'SWAP_COUNT_5';
ALTER TYPE "public"."MissionType" ADD VALUE 'SWAP_VOLUME_100';
ALTER TYPE "public"."MissionType" ADD VALUE 'HARVEST_REWARDS_ONCE';
