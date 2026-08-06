-- CreateEnum
CREATE TYPE "StatutDepense" AS ENUM ('A_PAYER', 'PAYEE', 'EN_RETARD');

-- CreateTable
CREATE TABLE "fournisseur" (
    "id" SERIAL NOT NULL,
    "entreprise_id" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "matricule_fiscal" TEXT,
    "siret" TEXT,
    "pays_id" INTEGER NOT NULL,
    "note" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fournisseur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "depense" (
    "id" SERIAL NOT NULL,
    "entreprise_id" INTEGER NOT NULL,
    "fournisseur_id" INTEGER NOT NULL,
    "categorie_id" INTEGER,
    "description" TEXT NOT NULL,
    "date_depense" TIMESTAMP(3) NOT NULL,
    "date_echeance" TIMESTAMP(3),
    "reference_facture" TEXT,
    "montant_ht" DECIMAL(15,2) NOT NULL,
    "taux_tva" DECIMAL(5,2) NOT NULL,
    "montant_tva" DECIMAL(15,2) NOT NULL,
    "montant_ttc" DECIMAL(15,2) NOT NULL,
    "tva_recuperable" BOOLEAN NOT NULL DEFAULT true,
    "statut" "StatutDepense" NOT NULL DEFAULT 'A_PAYER',
    "mode_paiement" "MethodePaiement",
    "justificatif_url" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "depense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "fournisseur_entreprise_id_siret_key" ON "fournisseur"("entreprise_id", "siret");

-- AddForeignKey
ALTER TABLE "fournisseur" ADD CONSTRAINT "fournisseur_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fournisseur" ADD CONSTRAINT "fournisseur_pays_id_fkey" FOREIGN KEY ("pays_id") REFERENCES "pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depense" ADD CONSTRAINT "depense_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depense" ADD CONSTRAINT "depense_fournisseur_id_fkey" FOREIGN KEY ("fournisseur_id") REFERENCES "fournisseur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "depense" ADD CONSTRAINT "depense_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categorie"("id") ON DELETE SET NULL ON UPDATE CASCADE;
