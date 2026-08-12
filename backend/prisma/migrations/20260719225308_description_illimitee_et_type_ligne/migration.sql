/*
  Warnings:

  - You are about to alter the column `prix_unitaire_ht` on the `devis_ligne` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,4)`.
  - You are about to alter the column `prix_unitaire_ht` on the `facture_ligne` table. The data in that column could be lost. The data in that column will be cast from `Decimal(15,2)` to `Decimal(15,4)`.

*/
-- AlterTable
ALTER TABLE "devis_ligne" ALTER COLUMN "prix_unitaire_ht" SET DATA TYPE DECIMAL(15,4);

-- AlterTable
ALTER TABLE "facture_ligne" ALTER COLUMN "prix_unitaire_ht" SET DATA TYPE DECIMAL(15,4);
