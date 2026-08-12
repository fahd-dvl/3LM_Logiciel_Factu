"""
Test de l'intégration Backend : simule une réponse brute telle que
FactureService.findOneWithDetails() / DevisService.findOne() la renverraient
(mêmes noms de champs que prisma/schema.prisma côté Backend), et vérifie que
backend_mapping.py + api.py produisent un PDF correct sans aucun mapping côté
Backend.
"""

from fastapi.testclient import TestClient

from api import app
from backend_mapping import mapper_devis, mapper_facture

client = TestClient(app)

PAYS_FR = {"id": 1, "code_iso": "FR", "nom": "France", "devise": "EUR"}

ENTREPRISE = {
    "id": 12,
    "utilisateur_id": 3,
    "type_structure": "artisan",
    "nom_entreprise": "Atelier Bois & Co",
    "matricule_fiscal": "1234567A",
    "siret": "123 456 789 00012",
    "adresse": "12 rue des Artisans",
    "code_postal": "75011",
    "ville": "Paris",
    "pays_id": 1,
    "representant_legal": "Julie Marchand",
    "logo_url": None,
}

CLIENT = {
    "id": 7,
    "entreprise_id": 12,
    "type": "particulier",
    "nom": "Dupont",
    "prenom": "Marc",
    "email": "marc.dupont@example.com",
    "telephone": None,
    "adresse": "5 avenue de la République",
    "code_postal": "75011",
    "ville": "Paris",
    "pays_id": 1,
    "siret": None,
    "matricule_fiscal": None,
    "adresse_legale": None,
    "raison_sociale": None,
    "pays": PAYS_FR,
}

# Sérialisation JSON réelle de Prisma : les Decimal deviennent des chaînes
FACTURE_LIGNE = [
    {
        "id": 1, "facture_id": 42, "produit_id": None,
        "description": "Table sur mesure chêne",
        "quantite": "1.00", "prix_unitaire_ht": "450.0000", "taux_tva": "20.00",
        "type_ligne": "PRODUIT",
        "montant_ht": "450.00", "montant_tva": "90.00", "montant_ttc": "540.00",
        "facture_acompte_id": None,
    },
    {
        "id": 2, "facture_id": 42, "produit_id": None,
        "description": "Livraison et installation",
        "quantite": "1.00", "prix_unitaire_ht": "60.0000", "taux_tva": "10.00",
        "type_ligne": "SERVICE",
        "montant_ht": "60.00", "montant_tva": "6.00", "montant_ttc": "66.00",
        "facture_acompte_id": None,
    },
]

FACTURE_BACKEND = {
    "id": 42,
    "entreprise_id": 12,
    "client_id": 7,
    "pays_id": 1,
    "devis_id": None,
    "numero": "FAC-2026-0142",
    "date_emission": "2026-07-15T00:00:00.000Z",
    "date_echeance": "2026-08-14T00:00:00.000Z",
    "statut": "ENVOYEE",
    "total_ht": "510.00", "total_tva": "96.00", "total_ttc": "606.00",
    "devise": "EUR",
    "mode_paiement": None,
    "est_acompte": False,
    "entreprise": ENTREPRISE,
    "client": CLIENT,
    "pays": PAYS_FR,
    "facture_ligne": FACTURE_LIGNE,
    "paiement": [],
    "devis": None,
}

DEVIS_LIGNE = [
    {
        "id": 1, "devis_id": 9, "produit_id": None,
        "description": "Table sur mesure chêne",
        "quantite": "1.00", "prix_unitaire_ht": "450.0000", "taux_tva": "20.00",
        "type_ligne": "PRODUIT",
        "montant_ht": "450.00", "montant_tva": "90.00", "montant_ttc": "540.00",
    },
]

DEVIS_BACKEND = {
    "id": 9,
    "entreprise_id": 12,
    "client_id": 7,
    "pays_id": 1,
    "numero": "DEV-2026-0087",
    "date_creation": "2026-07-20T00:00:00.000Z",
    "date_validite": "2026-08-20T00:00:00.000Z",
    "date_conversion_devis": None,
    "statut": "ENVOYE",
    "total_ht": "450.00", "total_tva": "90.00", "total_ttc": "540.00",
    "devise": "EUR",
    "devis_ligne": DEVIS_LIGNE,
    "client": CLIENT,
    # entreprise/pays absents : DevisService.findOne() ne les inclut pas aujourd'hui
}

print("=== Test mapper_facture() ===\n")
donnees = mapper_facture(FACTURE_BACKEND)
assert donnees["numero"] == "FAC-2026-0142"
assert donnees["date_emission"] == "15/07/2026"
assert donnees["company_name"] == "Atelier Bois & Co"
assert donnees["client_name"] == "Marc Dupont"
assert donnees["pays_code"] == "FR"
assert len(donnees["lignes"]) == 2
print(f"[OK] Facture mappée : {donnees['numero']} | {donnees['company_name']} -> {donnees['client_name']} | {donnees['date_emission']}")

print("\n=== Test mapper_devis() (entreprise fournie séparément) ===\n")
donnees_devis = mapper_devis(DEVIS_BACKEND, entreprise=ENTREPRISE, pays=PAYS_FR)
assert donnees_devis["numero"] == "DEV-2026-0087"
assert donnees_devis["quote_status"] == "Envoyé"
print(f"[OK] Devis mappé : {donnees_devis['numero']} | statut={donnees_devis['quote_status']}")

print("\n=== Test API /health ===\n")
resp = client.get("/health")
assert resp.status_code == 200
print(f"[OK] {resp.json()}")

print("\n=== Test API POST /pdf/facture ===\n")
resp = client.post("/pdf/facture", json=FACTURE_BACKEND)
assert resp.status_code == 200, resp.text
assert resp.headers["content-type"] == "application/pdf"
assert resp.content[:4] == b"%PDF"
with open("output/test_api_facture.pdf", "wb") as f:
    f.write(resp.content)
print(f"[OK] PDF reçu ({len(resp.content)} octets) -> output/test_api_facture.pdf")

print("\n=== Test API POST /pdf/facture/avoir ===\n")
resp = client.post("/pdf/facture/avoir", json={"facture": FACTURE_BACKEND, "motif": "Retour produit"})
assert resp.status_code == 200, resp.text
assert resp.content[:4] == b"%PDF"
with open("output/test_api_avoir.pdf", "wb") as f:
    f.write(resp.content)
print(f"[OK] PDF d'avoir reçu ({len(resp.content)} octets) -> output/test_api_avoir.pdf")

print("\n=== Test API : réponse Backend incomplète -> 422 propre ===\n")
resp = client.post("/pdf/facture", json={"numero": "FAC-INCOMPLET"})
assert resp.status_code == 422, resp.text
print(f"[OK] 422 attendu, reçu : {resp.json()['detail']}")

print("\nTous les tests d'intégration Backend sont passés.")
