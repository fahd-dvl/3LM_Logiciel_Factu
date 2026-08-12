"""
Test de la sous-tâche : "Tester la génération d'un avoir avec différents motifs
et vérifier que les montants et références sont corrects".
"""

from decimal import Decimal

from avoir import generer_avoir, AvoirError
from calcul import preparer_lignes, calculer_totaux
from pdf_service import generer_pdf


FACTURE_SOURCE = {
    "company_name": "Atelier Bois & Co",
    "company_siret": "123 456 789 00012",
    "company_matricule_fiscal": None,
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
    "lignes": [
        {"description": "Table sur mesure chêne", "quantite": 1, "prix_unitaire_ht": 450.00, "taux_tva": 20, "type_ligne": "PRODUIT"},
        {"description": "Livraison et installation", "quantite": 1, "prix_unitaire_ht": 60.00, "taux_tva": 10, "type_ligne": "SERVICE"},
        {"description": "Remise fidélité", "quantite": 1, "prix_unitaire_ht": -20.00, "taux_tva": 20, "type_ligne": "REMISE"},
    ],
}

print("=== Test : montants et références de l'avoir ===\n")

totaux_source = calculer_totaux(preparer_lignes(FACTURE_SOURCE["lignes"]))
avoir = generer_avoir(FACTURE_SOURCE, motif="Produit défectueux, remboursement intégral")
totaux_avoir = calculer_totaux(preparer_lignes(avoir["lignes"]))

assert avoir["numero"] == "AV-FAC-2026-0142", f"numéro inattendu : {avoir['numero']}"
assert avoir["facture_origine_numero"] == "FAC-2026-0142"
assert avoir["est_avoir"] is True
assert totaux_avoir["total_ht"] == -totaux_source["total_ht"], "total_ht non inversé correctement"
assert totaux_avoir["total_tva"] == -totaux_source["total_tva"], "total_tva non inversé correctement"
assert totaux_avoir["total_ttc"] == -totaux_source["total_ttc"], "total_ttc non inversé correctement"
print(f"[OK] Numéro avoir : {avoir['numero']} (référence : {avoir['facture_origine_numero']})")
print(f"[OK] Totaux source  : {totaux_source}")
print(f"[OK] Totaux avoir   : {totaux_avoir} (exactement inversés)")

# La ligne REMISE (prix_unitaire_ht négatif) doit rester cohérente avec la
# règle de calcul.py même après inversion (via la quantité, pas le prix)
ligne_remise_avoir = next(l for l in avoir["lignes"] if l["type_ligne"] == "REMISE")
assert Decimal(str(ligne_remise_avoir["prix_unitaire_ht"])) < 0, "le prix unitaire de la remise ne doit pas changer de signe"
assert Decimal(str(ligne_remise_avoir["quantite"])) < 0, "la quantité doit être inversée"
print(f"[OK] Ligne REMISE toujours cohérente : prix_unitaire_ht={ligne_remise_avoir['prix_unitaire_ht']}, quantite={ligne_remise_avoir['quantite']}")

print("\n=== Test : plusieurs motifs différents + génération PDF ===\n")
for i, motif in enumerate([
    "Produit défectueux, remboursement intégral",
    "Annulation de commande à la demande du client",
    "Erreur de facturation - double envoi",
], start=1):
    avoir = generer_avoir(FACTURE_SOURCE, motif=motif)
    assert avoir["motif_avoir"] == motif
    path = generer_pdf(avoir, "FACTURE", nom_fichier=f"test_avoir_{i}.pdf")
    print(f"[OK] Avoir {i} ({motif}) -> {path}")

print("\n=== Test des cas d'erreur ===\n")
try:
    generer_avoir(FACTURE_SOURCE, motif="")
    print("[ECHEC] Aucune erreur levée pour un motif vide !")
except AvoirError as e:
    print(f"[OK] Motif vide correctement rejeté : {e}")

try:
    generer_avoir({**FACTURE_SOURCE, "lignes": []}, motif="Test")
    print("[ECHEC] Aucune erreur levée pour une facture sans lignes !")
except AvoirError as e:
    print(f"[OK] Facture sans lignes correctement rejetée : {e}")

print("\nOuvre les PDF générés dans output/ pour vérifier visuellement la mention "
      "'FACTURE D'AVOIR', la référence à la facture d'origine et le motif affiché.")
