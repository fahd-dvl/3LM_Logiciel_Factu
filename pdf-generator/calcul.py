"""
Calcul des montants de lignes et totaux de devis/facture.

Miroir de CalculService (backend NestJS, src/common/services/calcul.service.ts) :
même arrondi ligne par ligne (2 décimales), mêmes règles de cohérence type_ligne/prix.
Si une ligne arrive du backend déjà calculée (montant_ht/montant_tva/montant_ttc
présents), on ne recalcule jamais : on fait confiance à ses valeurs pour ne jamais
diverger de l'arrondi appliqué côté backend.

Une ligne REMISE est exonérée de TVA : elle réduit le sous-total HT mais ne génère
aucune TVA et n'apparaît dans aucun groupe de taux (son taux_tva n'est donc utilisé
que pour la validation de cohérence, jamais pour calculer une taxe).
"""

from decimal import Decimal, ROUND_HALF_UP

TYPE_LIGNE_PRODUIT = "PRODUIT"
TYPE_LIGNE_SERVICE = "SERVICE"
TYPE_LIGNE_REMISE = "REMISE"
TYPES_LIGNE = {TYPE_LIGNE_PRODUIT, TYPE_LIGNE_SERVICE, TYPE_LIGNE_REMISE}


class CalculError(Exception):
    """Levée quand une ligne de devis/facture est incohérente (ex: remise positive)."""
    pass


def _d(value) -> Decimal:
    return value if isinstance(value, Decimal) else Decimal(str(value))


def _round2(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _valider_coherence_type_ligne(type_ligne: str, prix_unitaire_ht: Decimal) -> None:
    if type_ligne == TYPE_LIGNE_REMISE and prix_unitaire_ht > 0:
        raise CalculError(
            "Une ligne de type REMISE doit avoir un prix unitaire négatif ou nul"
        )
    if type_ligne != TYPE_LIGNE_REMISE and prix_unitaire_ht < 0:
        raise CalculError(
            "Un prix unitaire négatif n'est autorisé que pour une ligne de type REMISE"
        )


def calculer_ligne(quantite, prix_unitaire_ht, taux_tva, type_ligne=TYPE_LIGNE_PRODUIT) -> dict:
    qte = _d(quantite)
    prix_ht = _d(prix_unitaire_ht)
    montant_ht = _round2(qte * prix_ht)

    if type_ligne == TYPE_LIGNE_REMISE:
        montant_tva = Decimal("0.00")
    else:
        taux = _d(taux_tva)
        montant_tva = _round2(montant_ht * taux / Decimal(100))

    montant_ttc = montant_ht + montant_tva

    return {
        "montant_ht": montant_ht,
        "montant_tva": montant_tva,
        "montant_ttc": montant_ttc,
    }


def preparer_ligne(ligne: dict) -> dict:
    type_ligne = ligne.get("type_ligne", TYPE_LIGNE_PRODUIT)
    if type_ligne not in TYPES_LIGNE:
        raise CalculError(
            f"type_ligne invalide : '{type_ligne}'. Attendu : {', '.join(sorted(TYPES_LIGNE))}"
        )

    prix_ht = _d(ligne["prix_unitaire_ht"])
    _valider_coherence_type_ligne(type_ligne, prix_ht)

    if all(k in ligne and ligne[k] is not None for k in ("montant_ht", "montant_tva", "montant_ttc")):
        montants = {
            "montant_ht": _d(ligne["montant_ht"]),
            "montant_tva": _d(ligne["montant_tva"]),
            "montant_ttc": _d(ligne["montant_ttc"]),
        }
    else:
        montants = calculer_ligne(
            ligne["quantite"], prix_ht, ligne["taux_tva"], type_ligne
        )

    return {**ligne, "type_ligne": type_ligne, "prix_unitaire_ht": prix_ht, **montants}


def preparer_lignes(lignes: list) -> list:
    return [preparer_ligne(ligne) for ligne in lignes]


def calculer_totaux(lignes: list) -> dict:
    total_ht = sum((ligne["montant_ht"] for ligne in lignes), Decimal(0))
    total_tva = sum((ligne["montant_tva"] for ligne in lignes), Decimal(0))
    total_ttc = total_ht + total_tva

    return {"total_ht": total_ht, "total_tva": total_tva, "total_ttc": total_ttc}


def regrouper_par_taux_tva(lignes: list) -> list:
    """
    Regroupe les lignes taxables par taux de TVA pour l'affichage sur le PDF
    (ex: "TVA 3% : 364.11€ / TVA 17% : 454.66€"). Les lignes REMISE sont
    exclues : exonérées de TVA, elles ne doivent apparaître dans aucun groupe.
    """
    groupes = {}
    for ligne in lignes:
        if ligne.get("type_ligne") == TYPE_LIGNE_REMISE:
            continue
        taux = _d(ligne["taux_tva"])
        cle = str(taux)
        groupe = groupes.setdefault(
            cle, {"taux_tva": taux, "base_ht": Decimal(0), "montant_tva": Decimal(0)}
        )
        groupe["base_ht"] += ligne["montant_ht"]
        groupe["montant_tva"] += ligne["montant_tva"]

    return sorted(groupes.values(), key=lambda g: g["taux_tva"])
