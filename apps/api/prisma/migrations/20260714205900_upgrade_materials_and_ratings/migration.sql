-- CreateEnum
CREATE TYPE "MaterialStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "PreviewStatus" AS ENUM ('PROCESSING', 'READY', 'FAILED');

-- AlterTable (TeacherMaterial)
ALTER TABLE "TeacherMaterial" ADD COLUMN "status" "MaterialStatus" NOT NULL DEFAULT 'DRAFT';
ALTER TABLE "TeacherMaterial" ADD COLUMN "previewUrl" TEXT;
ALTER TABLE "TeacherMaterial" ADD COLUMN "previewStatus" "PreviewStatus";
ALTER TABLE "TeacherMaterial" ADD COLUMN "pageCount" INTEGER;
ALTER TABLE "TeacherMaterial" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "TeacherMaterial" ADD COLUMN "approvedBy" INTEGER;
ALTER TABLE "TeacherMaterial" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "TeacherMaterial" ADD COLUMN "rejectedBy" INTEGER;
ALTER TABLE "TeacherMaterial" ADD COLUMN "rejectedAt" TIMESTAMP(3);
ALTER TABLE "TeacherMaterial" ADD COLUMN "hiddenBy" INTEGER;
ALTER TABLE "TeacherMaterial" ADD COLUMN "hiddenAt" TIMESTAMP(3);

-- Copy existing data from old columns (isPublic, isApproved) to the new status column
UPDATE "TeacherMaterial"
SET "status" = CASE
    WHEN "isApproved" = true AND "isPublic" = true THEN 'APPROVED'::"MaterialStatus"
    WHEN "isApproved" = false AND "isPublic" = true THEN 'PENDING_REVIEW'::"MaterialStatus"
    ELSE 'DRAFT'::"MaterialStatus"
END;

-- AlterTable (TeacherMaterial) - Now safe to drop old columns
ALTER TABLE "TeacherMaterial" DROP COLUMN "isPublic";
ALTER TABLE "TeacherMaterial" DROP COLUMN "isApproved";

-- AlterTable (DocumentResource)
ALTER TABLE "document_resources" ADD COLUMN "previewUrl" TEXT;

-- CreateTable (document_ratings)
CREATE TABLE "document_ratings" (
    "id" SERIAL NOT NULL,
    "documentId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "hiddenReason" TEXT,
    "hiddenBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_ratings_documentId_studentId_key" ON "document_ratings"("documentId", "studentId");

-- AddForeignKey
ALTER TABLE "document_ratings" ADD CONSTRAINT "document_ratings_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "document_resources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_ratings" ADD CONSTRAINT "document_ratings_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
