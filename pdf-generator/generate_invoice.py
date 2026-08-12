from pdf_service import generer_pdf


def generate_invoice_pdf(data: dict, filename: str = "facture.pdf") -> str:
    return generer_pdf(data, "FACTURE", nom_fichier=filename)


if __name__ == "__main__":
    mock_data = {
        "company_name": "Atelier Bois & Co",
        "company_matricule_fiscal": "1234567A",
        "company_siret": None,
        "company_address": "12 rue des Artisans, 75011 Paris",
        "logo_path": None,
        "primary_color": "#1D9E75",
        "secondary_color": "#555555",
        "numero": "FAC-2026-0142",
        "date_emission": "15/07/2026",
        "date_echeance": "14/08/2026",
        "devise": "EUR",
        "client_name": "Julie Marchand",
        "client_address": "Tunis, Tunisie",
        "client_raison_sociale": None,
        "client_siret": None,
        "client_matricule_fiscal": None,
        "lignes": [
            {
                "description": "Table sur mesure chêne",
                "quantite": 1,
                "prix_unitaire_ht": 450.00,
                "taux_tva": 20,
                "type_ligne": "PRODUIT",
            },
            {
                "description": "Livraison et installation",
                "quantite": 1,
                "prix_unitaire_ht": 60.00,
                "taux_tva": 10,
                "type_ligne": "SERVICE",
            },
            {
                "description": "Remise fidélité",
                "quantite": 1,
                "prix_unitaire_ht": -20.00,
                "taux_tva": 20,
                "type_ligne": "REMISE",
            },
        ],
        "legal_mentions": ("En cas de retard de paiement, une pénalité de 3 fois le taux "
                            "d'intérêt légal sera applicable. Indemnité forfaitaire de 40 € "
                            "pour frais de recouvrement."),
    }
    path = generate_invoice_pdf(mock_data)
    print(f"Facture générée : {path}")
