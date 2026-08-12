import os
import re
import pathlib
from PIL import Image
from config import IMAGES_DIR

HEX_COLOR_RE = re.compile(r'^#(?:[0-9a-fA-F]{3}){1,2}$')
ALLOWED_LOGO_EXTENSIONS = {".png", ".jpg", ".jpeg", ".svg"}
MAX_LOGO_SIZE = (200, 200)  # largeur/hauteur max en pixels après redimensionnement


class PersonalizationError(Exception):
    """Levée quand un paramètre de personnalisation (logo ou couleur) est invalide."""
    pass


def _to_file_uri(path: str) -> str:
    """Convertit un chemin Windows/Unix en URI 'file:///' valide pour WeasyPrint,
    en gérant correctement les espaces et caractères accentués."""
    return pathlib.Path(path).resolve().as_uri()


def _est_url_distante(chemin: str) -> bool:
    return chemin.startswith("http://") or chemin.startswith("https://")


def _validate_color(color: str, field_name: str, default: str) -> str:
    if color is None:
        return default
    if not HEX_COLOR_RE.match(color):
        raise PersonalizationError(
            f"{field_name} invalide : '{color}'. Format attendu : '#RRGGBB' ou '#RGB'."
        )
    return color


def _validate_and_resize_logo(logo_path: str) -> str:
    if not logo_path:
        return None

    # Un logo venant du Backend (entreprise.logo_url) est une URL hébergée, pas
    # un fichier local : pas de redimensionnement possible sans le télécharger,
    # on la passe telle quelle — WeasyPrint la récupère lui-même au rendu.
    if _est_url_distante(logo_path):
        return logo_path

    if not os.path.isfile(logo_path):
        raise PersonalizationError(f"Logo introuvable : {logo_path}")

    ext = os.path.splitext(logo_path)[1].lower()
    if ext not in ALLOWED_LOGO_EXTENSIONS:
        raise PersonalizationError(
            f"Format de logo non supporté : '{ext}'. "
            f"Formats acceptés : {', '.join(sorted(ALLOWED_LOGO_EXTENSIONS))}"
        )

    # Les SVG sont vectoriels : pas de redimensionnement raster, le CSS gère l'échelle
    if ext == ".svg":
        return _to_file_uri(logo_path)

    try:
        with Image.open(logo_path) as img_check:
            img_check.verify()  # détecte un fichier corrompu sans le charger entièrement
    except Exception as e:
        raise PersonalizationError(f"Fichier logo corrompu ou illisible : {e}")

    image = Image.open(logo_path)  # réouverture obligatoire après verify()
    image.thumbnail(MAX_LOGO_SIZE, Image.LANCZOS)
    image = image.convert("RGBA")  # homogénéise le format, gère la transparence

    filename = os.path.splitext(os.path.basename(logo_path))[0]
    processed_path = os.path.join(IMAGES_DIR, f"{filename}_resized.png")
    image.save(processed_path, format="PNG")

    return _to_file_uri(processed_path)


def appliquer_personnalisation(logo_path: str = None,
                                couleur_primaire: str = "#1D9E75",
                                couleur_secondaire: str = "#333333") -> dict:
    """
    Valide et traite les éléments de personnalisation avant de les injecter
    dans un template de facture ou de devis.

    - Le logo est vérifié (existence, format, intégrité) puis redimensionné
      automatiquement (max 200x200 px), sauf pour les SVG (vectoriels).
    - Les couleurs doivent être des codes hexadécimaux valides ('#RRGGBB' ou '#RGB').

    Retourne un dict prêt à fusionner avec les données du document :
        {"logo_path": ..., "primary_color": ..., "secondary_color": ...}

    Lève une PersonalizationError si un paramètre est invalide.
    """
    validated_logo = _validate_and_resize_logo(logo_path)
    validated_primary = _validate_color(couleur_primaire, "couleur_primaire", default="#1D9E75")
    validated_secondary = _validate_color(couleur_secondaire, "couleur_secondaire", default="#333333")

    return {
        "logo_path": validated_logo,
        "primary_color": validated_primary,
        "secondary_color": validated_secondary,
    }