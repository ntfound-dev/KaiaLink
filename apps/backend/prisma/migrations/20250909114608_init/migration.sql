-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "nonce" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "telegramHandle" TEXT,
    "discordId" TEXT,
    "twitterHandle" TEXT,
    "lineId" TEXT,
    "sbtTokenId" TEXT,
    "sbtContractAddress" TEXT,
    "referredById" TEXT,
    "referralCode" TEXT NOT NULL,
    "isEligibleForAirdrop" BOOLEAN NOT NULL DEFAULT false,
    "hasClaimedAirdrop" BOOLEAN NOT NULL DEFAULT false,
    "airdropAmount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Mission" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "targetId" TEXT,

    CONSTRAINT "Mission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DeFiProfile" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "totalSwapVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "swapCount" INTEGER NOT NULL DEFAULT 0,
    "totalStakingVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "harvestCount" INTEGER NOT NULL DEFAULT 0,
    "totalLendSupplyVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalLendBorrowVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmmLiquidityVolume" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeFiProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CompletedMission" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "missionId" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompletedMission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Leaderboard" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "resetCycle" TEXT,

    CONSTRAINT "Leaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaderboardEntry" (
    "id" SERIAL NOT NULL,
    "leaderboardId" INTEGER NOT NULL,
    "userId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaderboardEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "public"."User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramHandle_key" ON "public"."User"("telegramHandle");

-- CreateIndex
CREATE UNIQUE INDEX "User_discordId_key" ON "public"."User"("discordId");

-- CreateIndex
CREATE UNIQUE INDEX "User_twitterHandle_key" ON "public"."User"("twitterHandle");

-- CreateIndex
CREATE UNIQUE INDEX "User_lineId_key" ON "public"."User"("lineId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "public"."User"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Mission_type_key" ON "public"."Mission"("type");

-- CreateIndex
CREATE UNIQUE INDEX "DeFiProfile_userId_key" ON "public"."DeFiProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompletedMission_userId_missionId_key" ON "public"."CompletedMission"("userId", "missionId");

-- CreateIndex
CREATE UNIQUE INDEX "Leaderboard_name_key" ON "public"."Leaderboard"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LeaderboardEntry_leaderboardId_userId_key" ON "public"."LeaderboardEntry"("leaderboardId", "userId");

-- AddForeignKey
ALTER TABLE "public"."User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DeFiProfile" ADD CONSTRAINT "DeFiProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompletedMission" ADD CONSTRAINT "CompletedMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CompletedMission" ADD CONSTRAINT "CompletedMission_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "public"."Mission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_leaderboardId_fkey" FOREIGN KEY ("leaderboardId") REFERENCES "public"."Leaderboard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaderboardEntry" ADD CONSTRAINT "LeaderboardEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
