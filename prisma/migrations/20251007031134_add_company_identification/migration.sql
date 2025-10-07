-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "companyId" TEXT;

-- AlterTable
ALTER TABLE "visitors" ADD COLUMN     "companyId" TEXT;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "domain" TEXT,
    "name" TEXT,
    "industry" TEXT,
    "size" TEXT,
    "location" TEXT,
    "country" TEXT,
    "city" TEXT,
    "revenue" TEXT,
    "linkedin" TEXT,
    "twitter" TEXT,
    "facebook" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "employees" INTEGER,
    "founded" TEXT,
    "technologies" TEXT,
    "ipRanges" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_domain_key" ON "companies"("domain");

-- AddForeignKey
ALTER TABLE "visitors" ADD CONSTRAINT "visitors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
