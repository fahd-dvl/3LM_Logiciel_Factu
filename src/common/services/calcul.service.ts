import { Injectable, BadRequestException } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { TypeLigne } from 'generated/prisma/browser';

export interface LigneEntree {
  quantite: Decimal.Value;
  prix_unitaire_ht: Decimal.Value;
  taux_tva: Decimal.Value;
  type_ligne?: TypeLigne;
}

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

export interface RegroupementTva {
  taux_tva: string;
  base_ht: Decimal;
  montant_tva: Decimal;
}

@Injectable()
export class CalculService {
  /**
   * Point d'entrée unique pour préparer une ligne avant sauvegarde :
   * valide la cohérence type/signe, calcule les montants, et retourne
   * la ligne complète avec type_ligne défaulté à PRODUIT si absent.
   * Utilisé par DevisService et FactureService (creer + update) pour
   * éviter toute duplication de cette logique.
   */
  preparerLigne<T extends LigneEntree>(
    ligne: T,
  ): T & LigneCalculee & { type_ligne: TypeLigne } {
    const typeLigne = ligne.type_ligne ?? 'PRODUIT';
    const prix = new Decimal(ligne.prix_unitaire_ht);

    this.validerCoherenceTypeLigne(typeLigne, prix);

    const montants = this.calculerLigne(
      ligne.quantite,
      ligne.prix_unitaire_ht,
      ligne.taux_tva,
    );

    return { ...ligne, type_ligne: typeLigne, ...montants };
  }

  preparerLignes<T extends LigneEntree>(
    lignes: T[],
  ): (T & LigneCalculee & { type_ligne: TypeLigne })[] {
    return lignes.map((ligne) => this.preparerLigne(ligne));
  }

  private validerCoherenceTypeLigne(
    typeLigne: TypeLigne,
    prixUnitaireHt: Decimal,
  ): void {
    if (typeLigne === 'REMISE' && prixUnitaireHt.gt(0)) {
      throw new BadRequestException(
        'Une ligne de type REMISE doit avoir un prix unitaire négatif ou nul',
      );
    }

    if (typeLigne !== 'REMISE' && prixUnitaireHt.lt(0)) {
      throw new BadRequestException(
        "Un prix unitaire négatif n'est autorisé que pour une ligne de type REMISE",
      );
    }
  }

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

  /**
   * Regroupe les lignes par taux de TVA pour l'affichage sur le PDF
   * (ex: "TVA 3% : 364,11€ / TVA 17% : 454,66€"), conforme à l'exigence
   * légale d'affichage détaillé sur les documents multi-taux.
   */
  regrouperParTauxTva<T extends { taux_tva: Decimal.Value } & LigneCalculee>(
    lignes: T[],
  ): RegroupementTva[] {
    const groupes = new Map<string, { base: Decimal; montant_tva: Decimal }>();

    for (const ligne of lignes) {
      const cle = new Decimal(ligne.taux_tva).toString();
      const existant = groupes.get(cle) ?? {
        base: new Decimal(0),
        montant_tva: new Decimal(0),
      };
      groupes.set(cle, {
        base: existant.base.plus(ligne.montant_ht),
        montant_tva: existant.montant_tva.plus(ligne.montant_tva),
      });
    }

    return Array.from(groupes.entries())
      .map(([taux_tva, v]) => ({
        taux_tva,
        base_ht: v.base,
        montant_tva: v.montant_tva,
      }))
      .sort((a, b) => Number(a.taux_tva) - Number(b.taux_tva));
  }
}
