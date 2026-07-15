-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "TypeStructure" AS ENUM ('artisan', 'entreprise', 'association', 'micro_entrepreneur');

-- CreateEnum
CREATE TYPE "StatutDevis" AS ENUM ('BROUILLON', 'ENVOYE', 'ACCEPTE', 'REFUSE', 'EXPIRE', 'CONVERTI');

-- CreateEnum
CREATE TYPE "StatutFacture" AS ENUM ('BROUILLON', 'ENVOYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE', 'EN_RETARD', 'ANNULEE');

-- CreateEnum
CREATE TYPE "TypeClient" AS ENUM ('particulier', 'entreprise');

-- CreateEnum
CREATE TYPE "MethodePaiement" AS ENUM ('CB', 'CHEQUE', 'VIREMENT', 'ESPECES');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "mot_de_passe_hash" TEXT NOT NULL,
    "prenom" TEXT,
    "nom" TEXT,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'user',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "derniere_connexion" TIMESTAMP(3),

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pays" (
    "id" SERIAL NOT NULL,
    "code_iso" VARCHAR(3) NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "devise" VARCHAR(10) NOT NULL,

    CONSTRAINT "pays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entreprise" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "type_structure" "TypeStructure" NOT NULL,
    "nom_entreprise" TEXT,
    "matricule_fiscal" VARCHAR(20) NOT NULL,
    "adresse" TEXT NOT NULL,
    "code_postal" TEXT,
    "ville" TEXT NOT NULL,
    "pays_id" INTEGER NOT NULL,
    "representant_legal" TEXT,

    CONSTRAINT "entreprise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mention_legale" (
    "id" SERIAL NOT NULL,
    "pays_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "texte" TEXT NOT NULL,

    CONSTRAINT "mention_legale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "type" "TypeClient" NOT NULL,
    "nom" VARCHAR(100) NOT NULL,
    "prenom" VARCHAR(100),
    "email" VARCHAR(150),
    "telephone" VARCHAR(20),
    "adresse" TEXT,
    "code_postal" VARCHAR(10),
    "ville" VARCHAR(100),
    "pays_id" INTEGER NOT NULL,
    "matricule_fiscal" VARCHAR(20),
    "note" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taux_tva" (
    "id" SERIAL NOT NULL,
    "pays_id" INTEGER NOT NULL,
    "taux" DECIMAL(5,2) NOT NULL,
    "libelle" VARCHAR(50) NOT NULL,
    "date_debut" TIMESTAMP(3) NOT NULL,
    "date_fin" TIMESTAMP(3),

    CONSTRAINT "taux_tva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produit_service" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "nom" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "prix_unitaire_ht" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "unite" VARCHAR(20) NOT NULL DEFAULT 'pièce',
    "taux_tva_id" INTEGER NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "produit_service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devis" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "entreprise_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "pays_id" INTEGER NOT NULL,
    "numero" VARCHAR(50) NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_validite" TIMESTAMP(3) NOT NULL,
    "statut" "StatutDevis" NOT NULL DEFAULT 'BROUILLON',
    "total_ht" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_tva" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_ttc" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "devise" VARCHAR(10) NOT NULL,

    CONSTRAINT "devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devis_ligne" (
    "id" SERIAL NOT NULL,
    "devis_id" INTEGER NOT NULL,
    "produit_id" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "quantite" DECIMAL(10,2) NOT NULL,
    "prix_unitaire_ht" DECIMAL(15,2) NOT NULL,
    "taux_tva" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "devis_ligne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facture" (
    "id" SERIAL NOT NULL,
    "utilisateur_id" INTEGER NOT NULL,
    "entreprise_id" INTEGER NOT NULL,
    "client_id" INTEGER NOT NULL,
    "pays_id" INTEGER NOT NULL,
    "devis_id" INTEGER,
    "numero" VARCHAR(50) NOT NULL,
    "date_emission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_echeance" TIMESTAMP(3) NOT NULL,
    "statut" "StatutFacture" NOT NULL DEFAULT 'BROUILLON',
    "total_ht" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_tva" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "total_ttc" DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    "devise" VARCHAR(10) NOT NULL,

    CONSTRAINT "facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facture_ligne" (
    "id" SERIAL NOT NULL,
    "facture_id" INTEGER NOT NULL,
    "produit_id" INTEGER,
    "description" VARCHAR(255) NOT NULL,
    "quantite" DECIMAL(10,2) NOT NULL,
    "prix_unitaire_ht" DECIMAL(15,2) NOT NULL,
    "taux_tva" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "facture_ligne_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paiement" (
    "id" SERIAL NOT NULL,
    "facture_id" INTEGER NOT NULL,
    "montant" DECIMAL(15,2) NOT NULL,
    "date_paiement" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "methode" "MethodePaiement" NOT NULL,
    "reference" VARCHAR(100),

    CONSTRAINT "paiement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pays_code_iso_key" ON "pays"("code_iso");

-- CreateIndex
CREATE UNIQUE INDEX "entreprise_utilisateur_id_key" ON "entreprise"("utilisateur_id");

-- CreateIndex
CREATE UNIQUE INDEX "entreprise_matricule_fiscal_key" ON "entreprise"("matricule_fiscal");

-- CreateIndex
CREATE UNIQUE INDEX "devis_numero_key" ON "devis"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "facture_numero_key" ON "facture"("numero");

-- AddForeignKey
ALTER TABLE "entreprise" ADD CONSTRAINT "entreprise_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entreprise" ADD CONSTRAINT "entreprise_pays_id_fkey" FOREIGN KEY ("pays_id") REFERENCES "pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mention_legale" ADD CONSTRAINT "mention_legale_pays_id_fkey" FOREIGN KEY ("pays_id") REFERENCES "pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client" ADD CONSTRAINT "client_pays_id_fkey" FOREIGN KEY ("pays_id") REFERENCES "pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taux_tva" ADD CONSTRAINT "taux_tva_pays_id_fkey" FOREIGN KEY ("pays_id") REFERENCES "pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produit_service" ADD CONSTRAINT "produit_service_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produit_service" ADD CONSTRAINT "produit_service_taux_tva_id_fkey" FOREIGN KEY ("taux_tva_id") REFERENCES "taux_tva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis" ADD CONSTRAINT "devis_pays_id_fkey" FOREIGN KEY ("pays_id") REFERENCES "pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis_ligne" ADD CONSTRAINT "devis_ligne_devis_id_fkey" FOREIGN KEY ("devis_id") REFERENCES "devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devis_ligne" ADD CONSTRAINT "devis_ligne_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produit_service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture" ADD CONSTRAINT "facture_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture" ADD CONSTRAINT "facture_entreprise_id_fkey" FOREIGN KEY ("entreprise_id") REFERENCES "entreprise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture" ADD CONSTRAINT "facture_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture" ADD CONSTRAINT "facture_pays_id_fkey" FOREIGN KEY ("pays_id") REFERENCES "pays"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture" ADD CONSTRAINT "facture_devis_id_fkey" FOREIGN KEY ("devis_id") REFERENCES "devis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_ligne" ADD CONSTRAINT "facture_ligne_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facture_ligne" ADD CONSTRAINT "facture_ligne_produit_id_fkey" FOREIGN KEY ("produit_id") REFERENCES "produit_service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paiement" ADD CONSTRAINT "paiement_facture_id_fkey" FOREIGN KEY ("facture_id") REFERENCES "facture"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
