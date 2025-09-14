-- CreateTable
CREATE TABLE "public"."PlatformAnalytics" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "totalTokens" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlatformAnalytics_category_key" ON "public"."PlatformAnalytics"("category");
