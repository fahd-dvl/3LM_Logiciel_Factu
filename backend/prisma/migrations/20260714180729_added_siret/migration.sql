/*
  Warnings:

  - A unique constraint covering the columns `[siret]` on the table `client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[siret]` on the table `entreprise` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "client" ADD COLUMN     "adresse_legale" TEXT,
ADD COLUMN     "raison_sociale" VARCHAR(200),
ADD COLUMN     "siret" VARCHAR(14);

-- AlterTable
ALTER TABLE "entreprise" ADD COLUMN     "siret" VARCHAR(14);

-- AlterTable
ALTER TABLE "produit_service" ADD COLUMN     "categorie_id" INTEGER;

-- CreateTable
CREATE TABLE "categorie" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "parent_id" INTEGER,

    CONSTRAINT "categorie_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_siret_key" ON "client"("siret");

-- CreateIndex
CREATE UNIQUE INDEX "entreprise_siret_key" ON "entreprise"("siret");

-- AddForeignKey
ALTER TABLE "categorie" ADD CONSTRAINT "categorie_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categorie" ADD CONSTRAINT "categorie_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produit_service" ADD CONSTRAINT "produit_service_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;
