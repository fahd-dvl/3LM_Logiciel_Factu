/*
  Warnings:

  - Added the required column `type` to the `produit_service` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypeProduitService" AS ENUM ('PRODUIT', 'SERVICE');

-- AlterTable
ALTER TABLE "produit_service" ADD COLUMN     "type" "TypeProduitService" NOT NULL;
