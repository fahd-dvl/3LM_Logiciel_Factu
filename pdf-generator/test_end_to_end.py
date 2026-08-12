"""
Test bout-en-bout : crée des données réelles dans le Backend NestJS local,
les récupère, et les envoie au service PDF local (api.py) pour générer un
vrai PDF à partir de vraies données Backend.

Prérequis (dans deux autres terminaux) :
    cd 3LM_Logiciel_Factu-main && npm run start:dev      # Backend sur :3001
    cd "Génération de Documents (PDF)" && uvicorn api:app --port 8001

Utilise `requests` (déjà une dépendance de ce projet) plutôt que curl/PowerShell :
gère nativement les cookies de session et l'encodage JSON, sans les pièges
rencontrés avec Invoke-WebRequest/curl.exe sous Windows (voir notes en bas).
"""

import sys

import requests

BACKEND_URL = "http://127.0.0.1:3001"
PDF_SERVICE_URL = "http://127.0.0.1:8001"

EMAIL = "test.majdi@example.com"
PASSWORD = "TestPass123"


def main():
    session = requests.Session()

    print("=== 1. Login ===")
    resp = session.post(f"{BACKEND_URL}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    resp.raise_for_status()
    login_data = resp.json()
    print(f"[OK] Connecté, entreprise_id={login_data['entreprise_id']}")

    if not login_data["entreprise_id"]:
        print("[ERREUR] Aucune entreprise active. Créez-en une via POST /entreprises "
              "puis /auth/choisir-entreprise avant de relancer ce script.")
        sys.exit(1)

    entreprise_id = login_data["entreprise_id"]

    print("\n=== 2. Créer un client ===")
    resp = session.post(f"{BACKEND_URL}/client", json={
        "type": "particulier",
        "nom": "Petit",
        "prenom": "Ahmed",
        "adresse": "22 boulevard des Fleurs",
        "code_postal": "75015",
        "ville": "Paris",
        "pays_id": 1,
    })
    resp.raise_for_status()
    client = resp.json()
    print(f"[OK] Client créé : id={client['id']}")

    print("\n=== 3. Créer une facture ===")
    resp = session.post(f"{BACKEND_URL}/factures", json={
        "client_id": client["id"],
        "pays_id": 1,
        "date_echeance": "2026-09-30",
        "devise": "EUR",
        "lignes": [
            {"type_ligne": "PRODUIT", "description": "Bibliothèque sur mesure", "quantite": 1, "prix_unitaire_ht": 620.00, "taux_tva": 20},
            {"type_ligne": "SERVICE", "description": "Montage à domicile", "quantite": 2, "prix_unitaire_ht": 45.00, "taux_tva": 10},
        ],
    })
    resp.raise_for_status()
    facture = resp.json()
    print(f"[OK] Facture créée : id={facture['id']}, numero={facture['numero']}, "
          f"total_ttc={facture['total_ttc']} {facture['devise']}")

    print("\n=== 4. Récupérer facture + entreprise (GET /factures/:id n'inclut pas entreprise/pays) ===")
    facture_complete = session.get(f"{BACKEND_URL}/factures/{facture['id']}").json()
    entreprise = session.get(f"{BACKEND_URL}/entreprises/{entreprise_id}").json()
    facture_complete["entreprise"] = entreprise
    facture_complete["pays"] = {"code_iso": "FR"}
    print(f"[OK] Fusionné : entreprise='{entreprise['nom_entreprise']}'")

    print("\n=== 5. Envoyer au service PDF (api.py) ===")
    resp = requests.post(f"{PDF_SERVICE_URL}/pdf/facture", json=facture_complete, timeout=30)
    if resp.status_code != 200:
        print(f"[ERREUR] {resp.status_code} : {resp.json()}")
        sys.exit(1)

    with open("output/facture_reelle_backend.pdf", "wb") as f:
        f.write(resp.content)
    print(f"[OK] PDF généré à partir de données Backend réelles : "
          f"output/facture_reelle_backend.pdf ({len(resp.content)} octets)")


if __name__ == "__main__":
    main()
