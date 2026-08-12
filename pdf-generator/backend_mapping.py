"""
Traduit la réponse JSON brute du Backend (Facture/Devis Prisma avec relations)
vers le format attendu par pdf_service.generer_pdf().

Cette traduction est volontairement centralisée ici plutôt que côté Backend :
Fahd n'a qu'à transmettre la réponse de FactureService.findOneWithDetails() (ou
équivalent) telle quelle, sans rien mapper de son côté.

Champs Prisma décimaux (quantite, prix_unitaire_ht, taux_tva, montant_*) : Prisma
sérialise ses Decimal en chaînes de caractères en JSON ("450.0000") — calcul.py
les convertit déjà via Decimal(str(valeur)), donc aucune conversion nécessaire ici.
"""

from datetime import datetime


class MappingError(Exception):
    """Levée quand la réponse Backend n'a pas la forme attendue (champ manquant)."""
    pass


LABELS_STATUT_DEVIS = {
    "BROUILLON": "Brouillon",
    "ENVOYE": "Envoyé",
    "ACCEPTE": "Accepté",
    "REFUSE": "Refusé",
    "EXPIRE": "Expiré",
    "CONVERTI": "Converti",
}


def _formater_date(valeur) -> str:
    """Convertit une date ISO 8601 (sérialisation JSON d'un DateTime Prisma) en DD/MM/YYYY."""
    if not valeur:
        return None
    if isinstance(valeur, str):
        valeur = datetime.fromisoformat(valeur.replace("Z", "+00:00"))
    return valeur.strftime("%d/%m/%Y")


def _adresse(obj: dict) -> str:
    parties = [obj.get("adresse"), obj.get("code_postal"), obj.get("ville")]
    return ", ".join(p for p in parties if p)


def _nom_client(client: dict) -> str:
    if client.get("type") == "entreprise" and client.get("raison_sociale"):
        return client["raison_sociale"]
    prenom = client.get("prenom") or ""
    nom = client.get("nom") or ""
    return f"{prenom} {nom}".strip()


def _champs_entreprise_client(entreprise: dict, client: dict, pays: dict) -> dict:
    return {
        "company_name": entreprise.get("nom_entreprise"),
        "company_matricule_fiscal": entreprise.get("matricule_fiscal"),
        "company_siret": entreprise.get("siret"),
        "company_address": _adresse(entreprise),
        "logo_path": entreprise.get("logo_url"),
        "pays_code":  (pays or {}).get("code") or (pays or {}).get("code_iso"),
        "client_name": _nom_client(client),
        "client_address": _adresse(client),
        "client_raison_sociale": client.get("raison_sociale"),
        "client_siret": client.get("siret"),
        "client_matricule_fiscal": client.get("matricule_fiscal"),
    }


def mapper_facture(facture_backend: dict, entreprise: dict = None, pays: dict = None) -> dict:
    """
    facture_backend : réponse de FactureService.findOne() (route GET /factures/:id
    réellement exposée). Vérifié contre un Backend local réel : cette réponse
    n'inclut PAS entreprise ni pays (seulement facture_ligne, client, paiement) —
    findOneWithDetails() qui les inclurait n'est appelée par aucune route du
    controller. En attendant que ce soit exposé, `entreprise` et `pays` doivent
    être fournis séparément par l'appelant (sauf si un jour la réponse les
    contient déjà, auquel cas ils sont utilisés en priorité).
    """
    entreprise = facture_backend.get("entreprise") or entreprise
    pays = facture_backend.get("pays") or pays

    if entreprise is None:
        raise MappingError(
            "L'entreprise n'est pas incluse dans la réponse facture du Backend "
            "(FactureService.findOne() n'inclut que facture_ligne/client/paiement) : "
            "passez-la explicitement via le paramètre 'entreprise'."
        )

    try:
        client = facture_backend["client"]
    except KeyError as e:
        raise MappingError(f"Champ manquant dans la réponse Backend (facture) : {e}") from e

    pays = pays or client.get("pays")

    donnees = _champs_entreprise_client(entreprise, client, pays)
    donnees.update({
        "numero": facture_backend["numero"],
        "date_emission": _formater_date(facture_backend.get("date_emission")),
        "date_echeance": _formater_date(facture_backend.get("date_echeance")),
        "devise": facture_backend["devise"],
        "lignes": facture_backend["facture_ligne"],
    })
    return donnees


def mapper_devis(devis_backend: dict, entreprise: dict = None, pays: dict = None) -> dict:
    """
    devis_backend : réponse de DevisService.findOne(), qui n'inclut aujourd'hui
    que devis_ligne et client — PAS entreprise ni pays (contrairement à la
    facture). En attendant que ce soit ajouté côté Backend, `entreprise` et
    `pays` doivent être fournis séparément par l'appelant (sauf si un jour
    devis_backend les contient déjà, auquel cas ils sont utilisés en priorité).
    """
    entreprise = devis_backend.get("entreprise") or entreprise
    pays = devis_backend.get("pays") or pays

    if entreprise is None:
        raise MappingError(
            "L'entreprise n'est pas incluse dans la réponse devis du Backend "
            "(DevisService.findOne() n'inclut que devis_ligne/client) : "
            "passez-la explicitement via le paramètre 'entreprise'."
        )

    try:
        client = devis_backend["client"]
    except KeyError as e:
        raise MappingError(f"Champ manquant dans la réponse Backend (devis) : {e}") from e

    donnees = _champs_entreprise_client(entreprise, client, pays)
    donnees.update({
        "numero": devis_backend["numero"],
        "quote_status": LABELS_STATUT_DEVIS.get(devis_backend.get("statut"), devis_backend.get("statut")),
        "date_creation": _formater_date(devis_backend.get("date_creation")),
        "date_validite": _formater_date(devis_backend.get("date_validite")),
        "devise": devis_backend["devise"],
        "lignes": devis_backend["devis_ligne"],
    })
    return donnees
