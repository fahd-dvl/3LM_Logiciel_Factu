/*
  Warnings:

  - You are about to drop the column `utilisateur_id` on the `categorie` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `client` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `compteur_numerotation` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `devis` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `facture` table. All the data in the column will be lost.
  - You are about to drop the column `utilisateur_id` on the `produit_service` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entreprise_id,siret]` on the table `client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[entreprise_id,type_document,annee]` on the table `compteur_numerotation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entreprise_id` to the `categorie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entreprise_id` to the `client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entreprise_id` to the `compteur_numerotation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entreprise_id` to the `produit_service` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "categorie" DROP CONSTRAINT "categorie_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "client" DROP CONSTRAINT "client_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "compteur_numerotation" DROP CONSTRAINT "compteur_numerotation_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "devis" DROP CONSTRAINT "devis_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "facture" DROP CONSTRAINT "facture_utilisateur_id_fkey";

-- DropForeignKey
ALTER TABLE "produit_service" DROP CONSTRAINT "produit_service_utilisateur_id_fkey";

-- DropIndex
DROP INDEX "client_siret_key";

-- DropIndex
DROP INDEX "compteur_numerotation_utilisateur_id_type_document_annee_key";

-- DropIndex
DROP INDEX "entreprise_utilisateur_id_key";

-- AlterTable
ALTER TABLE "categorie" DROP COLUMN "utilisateur_id",
ADD COLUMN     "entreprise_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "client" DROP COLUMN "utilisateur_id",
ADD COLUMN     "entreprise_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "compteur_numerotation" DROP COLUMN "utilisateur_id",
ADD COLUMN     "entreprise_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "devis" DROP COLUMN "utilisateur_id";

-- AlterTable
ALTER TABLE "entreprise" ADD COLUMN     "logo_url" TEXT;

-- AlterTable
ALTER TABLE "facture" DROP COLUMN "utilisateur_id",
ADD COLUMN     "est_acompte" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "facture_ligne" ADD COLUMN     "facture_acompte_id" INTEGER;

-- AlterTable
ALTER TABLE "produit_service" DROP COLUMN "utilisateur_id",
ADD COLUMN     "entreprise_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "client_entreprise_id_siret_key" ON "client"("entreprise_id", "siret");

-- CreateIndex
CREATE UNIQUE INDEX "compteur_numerotation_entreprise_id_type_document_annee_key" ON "compteur_numerotation"("entreprise_id", "type_document", "annee");

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorie" ADD CONSTRAINT "categorie_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produit_service" ADD CONSTRAINT "produit_service_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_ligne" ADD CONSTRAINT "facture_ligne_facture_acompte_id_fkey" FOREIGN KEY ("facture_acompte_id") REFERENCES "facture"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compteur_numerotation" ADD CONSTRAINT "compteur_numerotation_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
