/*
  Warnings:

  - The values [SOCIAL,TVL] on the enum `MissionType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."MissionType_new" AS ENUM ('JOIN_DISCORD_SERVER', 'LIKE_TWEET_X', 'JOIN_TELEGRAM_GROUP', 'ADD_LINE_OA', 'REFER_FRIEND', 'SWAP_VOLUME', 'STAKE_VOLUME', 'HARVEST_REWARDS', 'LENDING_VOLUME', 'AMM_LIQUIDITY_VOLUME');
ALTER TABLE "public"."Mission" ALTER COLUMN "type" TYPE "public"."MissionType_new" USING ("type"::text::"public"."MissionType_new");
ALTER TYPE "public"."MissionType" RENAME TO "MissionType_old";
ALTER TYPE "public"."MissionType_new" RENAME TO "MissionType";
DROP TYPE "public"."MissionType_old";
COMMIT;
