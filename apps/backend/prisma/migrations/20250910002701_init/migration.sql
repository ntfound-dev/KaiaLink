-- AlterTable
ALTER TABLE "public"."DeFiProfile" ADD COLUMN     "lastUpdatedBlock" BIGINT;

-- CreateTable
CREATE TABLE "public"."EventProcessed" (
    "txHash" TEXT NOT NULL,
    "logIndex" INTEGER NOT NULL,
    "contractAddr" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "blockNumber" BIGINT NOT NULL,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventProcessed_pkey" PRIMARY KEY ("txHash","logIndex")
);

-- CreateIndex
CREATE INDEX "EventProcessed_contractAddr_idx" ON "public"."EventProcessed"("contractAddr");
