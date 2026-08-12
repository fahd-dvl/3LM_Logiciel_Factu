import os
from dotenv import load_dotenv  # ⬅️ AJOUTE CETTE LIGNE

# Charge les variables du fichier .env
load_dotenv()  # ⬅️ AJOUTE CETTE LIGNE

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

ASSETS_DIR = os.path.join(BASE_DIR, "assets")
FONTS_DIR = os.path.join(ASSETS_DIR, "fonts")
IMAGES_DIR = os.path.join(ASSETS_DIR, "images")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

# Crée les dossiers s'ils n'existent pas
for folder in [ASSETS_DIR, FONTS_DIR, IMAGES_DIR, OUTPUT_DIR]:
    os.makedirs(folder, exist_ok=True)

# Endpoint Backend exposant les règles légales par pays (TVA, mentions obligatoires).
# Tant qu'il n'est pas défini, legal_mentions.py utilise des données mockées.
BACKEND_RULES_ENDPOINT = os.environ.get("BACKEND_RULES_ENDPOINT")