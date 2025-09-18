-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "referralPointsEarned" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."AmmPool" (
    "id" SERIAL NOT NULL,
    "pairAddress" TEXT NOT NULL,
    "tokenASymbol" TEXT NOT NULL,
    "tokenAAddress" TEXT NOT NULL,
    "tokenBSymbol" TEXT NOT NULL,
    "tokenBAddress" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tvl" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "volume24h" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "AmmPool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StakingFarm" (
    "id" SERIAL NOT NULL,
    "pid" INTEGER NOT NULL,
    "lpTokenAddress" TEXT NOT NULL,
    "lpTokenName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "apy" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tvl" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "StakingFarm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LendingMarket" (
    "id" SERIAL NOT NULL,
    "assetSymbol" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supplyApy" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "borrowApy" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalSupplied" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalBorrowed" DECIMAL(65,30) NOT NULL DEFAULT 0,

    CONSTRAINT "LendingMarket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AmmPool_pairAddress_key" ON "public"."AmmPool"("pairAddress");

-- CreateIndex
CREATE UNIQUE INDEX "StakingFarm_pid_key" ON "public"."StakingFarm"("pid");

-- CreateIndex
CREATE UNIQUE INDEX "LendingMarket_assetSymbol_key" ON "public"."LendingMarket"("assetSymbol");
