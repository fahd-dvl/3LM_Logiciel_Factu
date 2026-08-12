from pdf_service import generer_pdf


def generate_quote_pdf(data: dict, filename: str = "devis.pdf") -> str:
    return generer_pdf(data, "DEVIS", nom_fichier=filename)


if __name__ == "__main__":
    mock_data = {
        "company_name": "Atelier Bois & Co",
        "company_address": "12 rue des Artisans, 75011 Paris",
        "company_matricule_fiscal": None,
        "company_siret": "123 456 789 00012",
        "logo_path": None,
        "primary_color": "#1D9E75",
        "secondary_color": "#555555",
        "numero": "DEV-2026-0087",
        "quote_status": "En attente",
        "date_creation": "20/07/2026",
        "date_validite": "20/08/2026",
        "devise": "EUR",
        "client_name": "Julie Marchand",
        "client_address": "Tunis, Tunisie",
        "client_raison_sociale": None,
        "client_siret": None,
        "client_matricule_fiscal": None,
        "intro_message": ("Merci pour votre demande. Voici notre proposition détaillée pour "
                           "la fabrication et la livraison de votre mobilier sur mesure."),
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
        ],
        "payment_conditions": "30% d'acompte à la commande, solde à la livraison.",
        "acceptance_conditions": ("Ce devis est valable 30 jours à compter de sa date d'émission. "
                                   "Toute acceptation doit être formalisée par retour signé."),
        "legal_mentions": "TVA non applicable, art. 293B du CGI si franchise en base.",
    }

    path = generate_quote_pdf(mock_data)
    print(f"Devis généré : {path}")
