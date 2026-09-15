-- CreateEnum
CREATE TYPE "SchoolType" AS ENUM ('ELEMENTARY', 'JUNIOR_HIGH', 'HIGH_SCHOOL', 'UNIVERSITY', 'VOCATIONAL', 'OTHER');

-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "menuItems" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "schoolType" "SchoolType";
