-- CreateEnum
CREATE TYPE "TypeDocument" AS ENUM ('DEVIS', 'FACTURE');

-- CreateTable
CREATE TABLE "compteur_numerotation" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "type_document" "TypeDocument" NOT NULL,
    "annee" INTEGER NOT NULL,
    "dernier_numero" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "compteur_numerotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "compteur_numerotation_utilisateur_id_type_document_annee_key" ON "compteur_numerotation"("utilisateur_id", "type_document", "annee");

-- AddForeignKey
ALTER TABLE "compteur_numerotation" ADD CONSTRAINT "compteur_numerotation_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
