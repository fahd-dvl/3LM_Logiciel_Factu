"""
Récupération des mentions légales obligatoires par pays (taux de TVA, libellé de
l'identifiant fiscal, mentions de retard de paiement, etc.), pour insertion
automatique dans le pied de page des factures/devis.

Bascule automatiquement entre l'endpoint Backend (dès que BACKEND_RULES_ENDPOINT
est configuré) et des données mockées (FR, BE, TN, LU) en repli, avec la même
structure de sortie dans les deux cas.
"""

import sys

import requests

from config import BACKEND_RULES_ENDPOINT

REQUEST_TIMEOUT_SECONDS = 5


class LegalMentionsError(Exception):
    """Levée quand un pays n'est supporté ni par le Backend, ni par le mock."""
    pass


MOCK_MENTIONS_LEGALES = {
    "FR": {
        "devise": "EUR",
        "taux_tva": 20.0,
        "libelle_identifiant_fiscal": "SIRET",
        "mentions": [
            "En cas de retard de paiement, une pénalité égale à 3 fois le taux d'intérêt "
            "légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40 € pour frais "
            "de recouvrement (art. L441-10 du Code de commerce).",
        ],
    },
    "BE": {
        "devise": "EUR",
        "taux_tva": 21.0,
        "libelle_identifiant_fiscal": "Numéro de TVA (BCE)",
        "mentions": [
            "Sauf accord contraire, toute somme impayée à l'échéance porte intérêt de "
            "plein droit et sans mise en demeure préalable, majorée d'une indemnité "
            "forfaitaire de 10% du montant dû, avec un minimum de 40 €.",
        ],
    },
    "TN": {
        "devise": "TND",
        "taux_tva": 19.0,
        "libelle_identifiant_fiscal": "Matricule Fiscal",
        "mentions": [
            "Facture soumise à la réglementation fiscale tunisienne en vigueur. "
            "Timbre fiscal applicable selon la législation en vigueur.",
        ],
    },
    "LU": {
        "devise": "EUR",
        "taux_tva": 17.0,
        "libelle_identifiant_fiscal": "Numéro de TVA",
        "mentions": [
            "En cas de non-paiement à l'échéance, des intérêts de retard seront appliqués "
            "conformément à la législation luxembourgeoise en vigueur.",
        ],
    },
}


def _normaliser(pays_code: str, donnees: dict) -> dict:
    mentions = list(donnees["mentions"])
    return {
        "pays_code": pays_code,
        "devise": donnees["devise"],
        "taux_tva": donnees["taux_tva"],
        "libelle_identifiant_fiscal": donnees["libelle_identifiant_fiscal"],
        "mentions": mentions,
        "mentions_legales": " ".join(mentions),
    }


def _depuis_mock(pays_code: str) -> dict:
    donnees = MOCK_MENTIONS_LEGALES.get(pays_code.upper())
    if donnees is None:
        raise LegalMentionsError(
            f"Pays non supporté : '{pays_code}'. "
            f"Pays disponibles (mock) : {', '.join(sorted(MOCK_MENTIONS_LEGALES))}"
        )
    return _normaliser(pays_code.upper(), donnees)


def _depuis_backend(pays_code: str) -> dict:
    # ✅ AJOUT DE /regles à la fin de l'URL
    url = f"{BACKEND_RULES_ENDPOINT.rstrip('/')}/{pays_code}/regles"
    reponse = requests.get(
        url,
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    reponse.raise_for_status()
    return _normaliser(pays_code.upper(), reponse.json())


def fetch_mentions_legales(pays_code: str) -> dict:
    """
    Retourne les règles légales d'un pays sous la forme :

        {
            "pays_code": "FR",
            "devise": "EUR",
            "taux_tva": 20.0,
            "libelle_identifiant_fiscal": "SIRET",
            "mentions": [...],
            "mentions_legales": "texte concaténé prêt pour le pied de page",
        }

    Appelle BACKEND_RULES_ENDPOINT si configuré ; à défaut (ou en cas d'échec de
    l'appel), utilise les données mockées (FR, BE, TN, LU).
    """
    if not BACKEND_RULES_ENDPOINT:
        return _depuis_mock(pays_code)

    try:
        return _depuis_backend(pays_code)
    except (requests.RequestException, ValueError, KeyError) as e:
        print(
            f"[legal_mentions] Backend injoignable ({e}), repli sur les données "
            f"mockées pour '{pays_code}'.",
            file=sys.stderr,
        )
        return _depuis_mock(pays_code)