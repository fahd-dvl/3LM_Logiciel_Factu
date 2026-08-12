"""
Service générique de génération de PDF (facture/devis) — point d'entrée unique
destiné à être appelé directement par le Backend.

generer_pdf(donnees, template_type, personnalisation) orchestre : validation des
paramètres, personnalisation (logo/couleurs), calcul des lignes/totaux/TVA,
remplissage automatique des mentions légales par pays, rendu du template Jinja2
et conversion en PDF via WeasyPrint.

Toute erreur (paramètres invalides, logo/couleur invalide, ligne incohérente,
pays non supporté, échec de rendu) est remontée sous la forme d'une seule
PdfGenerationError avec la cause d'origine attachée (`__cause__`), pour que
l'appelant n'ait qu'un unique type d'exception à gérer.
"""

# ===== AJOUT POUR WINDOWS - FORCER LE CHEMIN DES DLL =====
import os
import sys

# Chemin vers les DLL MSYS2
MSYS2_BIN = r'C:\msys64\mingw64\bin'

# Vérifier que le dossier existe
if os.path.exists(MSYS2_BIN):
    # Variable d'environnement pour WeasyPrint
    os.environ['WEASYPRINT_DLL_DIRECTORIES'] = MSYS2_BIN
    
    # Ajout au PATH Windows
    os.environ['PATH'] = MSYS2_BIN + os.pathsep + os.environ.get('PATH', '')
    
    # Pour Python 3.8+ (méthode officielle)
    if hasattr(os, 'add_dll_directory'):
        try:
            os.add_dll_directory(MSYS2_BIN)
            print(f"✅ DLL directory ajouté : {MSYS2_BIN}")
        except Exception as e:
            print(f"⚠️ Erreur add_dll_directory : {e}")
else:
    print(f"⚠️ Dossier MSYS2 non trouvé : {MSYS2_BIN}")

# ===== FIN DE L'AJOUT =====

import logging
import os

from jinja2 import Environment, FileSystemLoader, TemplateError
from weasyprint import HTML

from config import OUTPUT_DIR
from personalization import appliquer_personnalisation, PersonalizationError
from calcul import preparer_lignes, calculer_totaux, regrouper_par_taux_tva, CalculError
from legal_mentions import fetch_mentions_legales, LegalMentionsError

logger = logging.getLogger(__name__)

TEMPLATES_DIR = "templates"

TEMPLATE_TYPES = {
    "FACTURE": {
        "fichier": "invoice.html",
        "champs_requis": (
            "numero", "date_emission", "date_echeance", "devise",
            "company_name", "company_address", "client_name", "client_address", "lignes",
        ),
    },
    "DEVIS": {
        "fichier": "devis.html",
        "champs_requis": (
            "numero", "date_creation", "date_validite", "devise",
            "company_name", "company_address", "client_name", "client_address", "lignes",
        ),
    },
}


class PdfGenerationError(Exception):
    """Erreur unique remontée à l'appelant, quelle que soit la cause d'origine
    (paramètres invalides, personnalisation, calcul, mentions légales, rendu)."""
    pass


def _valider_parametres(donnees: dict, template_type: str, personnalisation) -> dict:
    if not isinstance(donnees, dict):
        raise PdfGenerationError("'donnees' doit être un dict")

    if template_type not in TEMPLATE_TYPES:
        raise PdfGenerationError(
            f"template_type invalide : '{template_type}'. Attendu : {', '.join(TEMPLATE_TYPES)}"
        )

    if personnalisation is not None and not isinstance(personnalisation, dict):
        raise PdfGenerationError("'personnalisation' doit être un dict ou None")

    config_template = TEMPLATE_TYPES[template_type]
    champs_manquants = [c for c in config_template["champs_requis"] if not donnees.get(c)]
    if champs_manquants:
        raise PdfGenerationError(
            f"Champs obligatoires manquants pour {template_type} : {', '.join(champs_manquants)}"
        )

    if not isinstance(donnees["lignes"], list):
        raise PdfGenerationError("'lignes' doit être une liste")

    return config_template


def generer_pdf(
    donnees: dict,
    template_type: str,
    personnalisation: dict = None,
    *,
    retour: str = "fichier",
    nom_fichier: str = None,
):
    """
    Point d'entrée générique de génération de PDF, appelable directement par le
    Backend.

    - donnees : dict des données du document (voir README pour le format attendu)
    - template_type : "FACTURE" ou "DEVIS"
    - personnalisation : dict optionnel {"logo_path", "primary_color", "secondary_color"} ;
      à défaut, ces clés sont lues directement dans `donnees`
    - retour : "fichier" (écrit dans output/ et retourne le chemin, str) ou "bytes"
      (retourne le contenu du PDF en mémoire, bytes — pour une réponse HTTP Backend)

    Lève PdfGenerationError pour toute erreur.
    """
    template_type = (template_type or "").upper()
    config_template = _valider_parametres(donnees, template_type, personnalisation)

    donnees = dict(donnees)  # ne jamais muter le dict de l'appelant
    perso_source = personnalisation if personnalisation is not None else donnees

    try:
        perso = appliquer_personnalisation(
            logo_path=perso_source.get("logo_path"),
            couleur_primaire=perso_source.get("primary_color", "#1D9E75"),
            couleur_secondaire=perso_source.get("secondary_color", "#333333"),
        )
        donnees.update(perso)

        if donnees.get("pays_code") and not donnees.get("legal_mentions"):
            regles = fetch_mentions_legales(donnees["pays_code"])
            donnees["legal_mentions"] = regles["mentions_legales"]

        lignes = preparer_lignes(donnees.pop("lignes"))
        totaux = calculer_totaux(lignes)
        tva_groupes = regrouper_par_taux_tva(lignes)

        env = Environment(loader=FileSystemLoader(TEMPLATES_DIR))
        template = env.get_template(config_template["fichier"])
        html_content = template.render(**donnees, lignes=lignes, tva_groupes=tva_groupes, **totaux)

        pdf_bytes = HTML(string=html_content).write_pdf()
    except (PersonalizationError, CalculError, LegalMentionsError, TemplateError) as e:
        logger.error("Échec de génération PDF (%s) : %s", template_type, e)
        raise PdfGenerationError(str(e)) from e
    except Exception as e:
        logger.exception("Erreur inattendue pendant la génération PDF (%s)", template_type)
        raise PdfGenerationError(f"Erreur inattendue : {e}") from e

    logger.info("PDF %s généré (%d octets)", template_type, len(pdf_bytes))

    if retour == "bytes":
        return pdf_bytes

    if retour != "fichier":
        raise PdfGenerationError(f"retour invalide : '{retour}'. Attendu : 'fichier' ou 'bytes'")

    nom_fichier = nom_fichier or f"{template_type.lower()}_{donnees.get('numero', 'document')}.pdf"
    filepath = os.path.join(OUTPUT_DIR, nom_fichier)
    with open(filepath, "wb") as f:
        f.write(pdf_bytes)
    return filepath