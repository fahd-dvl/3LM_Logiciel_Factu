import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

export interface LigneCalculee {
  montant_ht: Decimal;
  montant_tva: Decimal;
  montant_ttc: Decimal;
}

export interface TotauxDocument {
  total_ht: Decimal;
  total_tva: Decimal;
  total_ttc: Decimal;
}

@Injectable()
export class CalculService {
  /**
   * Calcule les montants d'une ligne à partir de la quantité, du prix unitaire HT
   * et du taux de TVA. Arrondi à 2 décimales au niveau de la ligne (choix légal
   * "arrondi ligne par ligne" plutôt que "arrondi sur le total").
   */
  calculerLigne(
    quantite: Decimal.Value,
    prixUnitaireHt: Decimal.Value,
    tauxTva: Decimal.Value,
  ): LigneCalculee {
    const qte = new Decimal(quantite);
    const prixHt = new Decimal(prixUnitaireHt);
    const taux = new Decimal(tauxTva);

    const montantHt = qte.mul(prixHt).toDecimalPlaces(2);
    const montantTva = montantHt.mul(taux).div(100).toDecimalPlaces(2);
    const montantTtc = montantHt.plus(montantTva);

    return {
      montant_ht: montantHt,
      montant_tva: montantTva,
      montant_ttc: montantTtc,
    };
  }

  /**
   * Agrège les totaux d'un document à partir de ses lignes déjà calculées.
   */
  calculerTotaux(lignes: LigneCalculee[]): TotauxDocument {
    const totalHt = lignes.reduce(
      (acc, l) => acc.plus(l.montant_ht),
      new Decimal(0),
    );
    const totalTva = lignes.reduce(
      (acc, l) => acc.plus(l.montant_tva),
      new Decimal(0),
    );
    const totalTtc = totalHt.plus(totalTva);

    return {
      total_ht: totalHt,
      total_tva: totalTva,
      total_ttc: totalTtc,
    };
  }
}
