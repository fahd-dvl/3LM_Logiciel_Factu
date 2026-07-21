-- CreateEnum
CREATE TYPE "TypeLigne" AS ENUM ('PRODUIT', 'SERVICE', 'REMISE');

-- AlterTable
ALTER TABLE "devis_ligne" ALTER COLUMN "description" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "facture_ligne" ALTER COLUMN "description" SET DATA TYPE TEXT;
