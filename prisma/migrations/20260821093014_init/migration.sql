-- CreateTable
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "pinSalt" TEXT,
    "pinHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "category" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "date" TEXT NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "profileId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "monthlyBudget" DECIMAL(12,2),

    CONSTRAINT "settings_pkey" PRIMARY KEY ("profileId")
);

-- CreateIndex
CREATE INDEX "expenses_profileId_date_idx" ON "expenses"("profileId", "date");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "settings_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
