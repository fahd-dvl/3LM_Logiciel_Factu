-- AlterTable
ALTER TABLE "devis_ligne" ADD COLUMN     "type_ligne" "TypeLigne" NOT NULL DEFAULT 'PRODUIT';

-- AlterTable
ALTER TABLE "facture_ligne" ADD COLUMN     "type_ligne" "TypeLigne" NOT NULL DEFAULT 'PRODUIT';
