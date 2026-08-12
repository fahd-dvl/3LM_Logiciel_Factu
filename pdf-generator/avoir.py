"""
Génération de factures d'avoir (remboursement/annulation).

Une facture d'avoir reprend les données de la facture d'origine, inverse le
montant de chaque ligne, et ajoute la référence à la facture initiale ainsi
qu'un motif. Le PDF résultant se génère ensuite normalement via
pdf_service.generer_pdf(avoir, "FACTURE").

Ce module ne récupère pas la facture par son id : comme le reste de ce module,
il reçoit les données déjà chargées par l'appelant (Backend) — il n'y a pas
d'endpoint Backend à interroger pour une facture individuelle.

L'inversion se fait en négativant la quantité, jamais le prix unitaire : une
ligne REMISE doit garder un prix_unitaire_ht négatif ou nul (règle de
calcul.py), donc inverser le prix casserait cette contrainte. Négativer la
quantité inverse le montant final de la même façon, quel que soit le type de
ligne, sans violer aucune règle de cohérence.
"""

from decimal import Decimal


class AvoirError(Exception):
    """Levée quand la génération d'un avoir échoue (motif manquant, facture source invalide)."""
    pass


def generer_avoir(donnees_facture: dict, motif: str, montants_inverses: bool = True) -> dict:
    """
    Construit les données d'une facture d'avoir à partir d'une facture source
    (mêmes champs que ceux attendus par pdf_service.generer_pdf(..., "FACTURE")).

    - motif : raison de l'avoir (obligatoire), affichée sur le document
    - montants_inverses : si True (par défaut), inverse le montant de chaque
      ligne en négativant la quantité

    Retourne un nouveau dict, prêt à être passé à pdf_service.generer_pdf(..., "FACTURE").
    Ne modifie pas `donnees_facture`.
    """
    if not motif or not motif.strip():
        raise AvoirError("Le motif de l'avoir est obligatoire")

    if not donnees_facture.get("numero"):
        raise AvoirError("La facture source doit avoir un 'numero'")

    if not donnees_facture.get("lignes"):
        raise AvoirError("La facture source doit avoir au moins une ligne")

    numero_origine = donnees_facture["numero"]

    avoir = dict(donnees_facture)
    avoir["numero"] = f"AV-{numero_origine}"
    avoir["facture_origine_numero"] = numero_origine
    avoir["est_avoir"] = True
    avoir["motif_avoir"] = motif.strip()

    lignes = []
    for ligne in donnees_facture["lignes"]:
        nouvelle_ligne = dict(ligne)
        if montants_inverses:
            nouvelle_ligne["quantite"] = -Decimal(str(ligne["quantite"]))
            # Une ligne déjà calculée par le Backend (montant_ht/tva/ttc fournis)
            # doit aussi voir ses montants inversés explicitement, sinon calcul.py
            # les prendrait tels quels — incohérents avec la quantité inversée.
            for champ in ("montant_ht", "montant_tva", "montant_ttc"):
                if ligne.get(champ) is not None:
                    nouvelle_ligne[champ] = -Decimal(str(ligne[champ]))
        lignes.append(nouvelle_ligne)

    avoir["lignes"] = lignes
    return avoir
