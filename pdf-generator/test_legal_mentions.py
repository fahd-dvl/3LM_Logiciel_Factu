"""
Test de la sous-tâche : "Intégrer les mentions légales dans le pied de page du
template et tester avec au moins 2 pays différents".

Vérifie fetch_mentions_legales() pour chaque pays mocké, le cas d'erreur d'un
pays non supporté, puis génère une facture par pays pour vérification visuelle
du pied de page.
"""

from legal_mentions import fetch_mentions_legales, LegalMentionsError, MOCK_MENTIONS_LEGALES
from generate_invoice import generate_invoice_pdf


BASE_DATA = {
    "company_name": "Atelier Bois & Co",
    "company_matricule_fiscal": None,
    "company_siret": "123 456 789 00012",
    "company_address": "12 rue des Artisans, 75011 Paris",
    "logo_path": None,
    "primary_color": "#1D9E75",
    "secondary_color": "#555555",
    "numero": "FAC-2026-0142",
    "date_emission": "15/07/2026",
    "date_echeance": "14/08/2026",
    "client_name": "Julie Marchand",
    "client_address": "Tunis, Tunisie",
    "lignes": [
        {"description": "Table sur mesure chêne", "quantite": 1, "prix_unitaire_ht": 450.00, "taux_tva": 20, "type_ligne": "PRODUIT"},
        {"description": "Livraison et installation", "quantite": 1, "prix_unitaire_ht": 60.00, "taux_tva": 10, "type_ligne": "SERVICE"},
    ],
}

print("=== Test fetch_mentions_legales() pour chaque pays mocké ===\n")
for pays_code in sorted(MOCK_MENTIONS_LEGALES):
    regles = fetch_mentions_legales(pays_code)
    print(f"[OK] {pays_code} -> TVA {regles['taux_tva']}% | {regles['libelle_identifiant_fiscal']} | {regles['devise']}")
    print(f"     {regles['mentions_legales']}\n")

print("=== Test du cas d'erreur (pays non supporté) ===\n")
try:
    fetch_mentions_legales("XX")
    print("[ECHEC] Aucune erreur levée pour un pays non supporté !")
except LegalMentionsError as e:
    print(f"[OK] Pays non supporté correctement rejeté : {e}")

print("\n=== Génération d'une facture par pays (pied de page auto-rempli) ===\n")
for pays_code, devise in [("FR", "EUR"), ("TN", "TND")]:
    data = {**BASE_DATA, "pays_code": pays_code, "devise": devise}
    filename = f"test_mentions_{pays_code.lower()}.pdf"
    path = generate_invoice_pdf(data, filename=filename)
    print(f"[OK] Facture {pays_code} -> {path}")

print("\nOuvre les PDF générés dans output/ pour vérifier que le pied de page "
      "contient bien les mentions légales spécifiques à chaque pays.")
