"""
Test de la sous-tâche : "Tester avec plusieurs logos et combinaisons de couleurs,
vérifier que les PDF générés respectent les personnalisations".

Génère plusieurs factures avec des personnalisations différentes pour vérification
visuelle manuelle, et teste que les cas d'erreur sont bien gérés.
"""

from personalization import appliquer_personnalisation, PersonalizationError
from generate_invoice import generate_invoice_pdf


BASE_DATA = {
    "company_name": "Atelier Bois & Co",
    "company_siret": "123 456 789 00012",
    "company_matricule_fiscal": None,
    "company_address": "12 rue des Artisans, 75011 Paris",
    "numero": "FAC-2026-0142",
    "date_emission": "15/07/2026",
    "date_echeance": "14/08/2026",
    "devise": "EUR",
    "client_name": "Julie Marchand",
    "client_address": "Tunis, Tunisie",
    "lignes": [
        {"description": "Table sur mesure chêne", "quantite": 1, "prix_unitaire_ht": 450.00, "taux_tva": 20, "type_ligne": "PRODUIT"},
        {"description": "Livraison et installation", "quantite": 1, "prix_unitaire_ht": 60.00, "taux_tva": 10, "type_ligne": "SERVICE"},
    ],
    "legal_mentions": "En cas de retard de paiement, une pénalité de 3 fois le taux légal s'applique.",
}

# Combinaisons de couleurs à tester (sans logo pour l'instant, à adapter avec un vrai fichier)
COLOR_COMBINATIONS = [
    ("#1D9E75", "#555555"),  # vert / gris (référence)
    ("#2563EB", "#1E293B"),  # bleu / gris foncé
    ("#DC2626", "#000000"),  # rouge / noir
]

print("=== Test des combinaisons de couleurs ===\n")
for i, (primary, secondary) in enumerate(COLOR_COMBINATIONS, start=1):
    data = {**BASE_DATA, "logo_path": None, "primary_color": primary, "secondary_color": secondary}
    filename = f"test_couleurs_{i}.pdf"
    path = generate_invoice_pdf(data, filename=filename)
    print(f"[OK] Combinaison {i} ({primary} / {secondary}) -> {path}")

print("\n=== Test avec un logo (remplace le chemin ci-dessous par un vrai fichier) ===\n")
# Décommente et adapte ce bloc avec un vrai logo pour tester le redimensionnement automatique :
#
data_with_logo = {
     **BASE_DATA,
     "logo_path": "assets/images/ard.png",
     "primary_color": "#1D9E75",
     "secondary_color": "#333333",
 }
path = generate_invoice_pdf(data_with_logo, filename="test_avec_logo.pdf")
print(f"[OK] Facture avec logo -> {path}")

print("\n=== Test des cas d'erreur (doivent échouer proprement) ===\n")

try:
    appliquer_personnalisation(couleur_primaire="pas-une-couleur")
    print("[ECHEC] Aucune erreur levée pour une couleur invalide !")
except PersonalizationError as e:
    print(f"[OK] Couleur invalide correctement rejetée : {e}")

try:
    appliquer_personnalisation(logo_path="logo_qui_n_existe_pas.png")
    print("[ECHEC] Aucune erreur levée pour un logo introuvable !")
except PersonalizationError as e:
    print(f"[OK] Logo introuvable correctement rejeté : {e}")

print("\nOuvre les PDF générés dans output/ pour vérifier visuellement "
      "que chaque combinaison de couleurs est bien appliquée à l'en-tête, "
      "au tableau et aux mentions légales.")