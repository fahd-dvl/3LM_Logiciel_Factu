# Génération de Documents (PDF) — Logiciel de Facturation

Module de génération de documents PDF (factures, devis, factures d'avoir) pour un logiciel de facturation destiné aux indépendants, artisans et petites entreprises.

Ce module transforme des données structurées (fournies par le Backend) en documents PDF professionnels, personnalisables et légalement conformes. Le contrat de données (noms de champs, structure des lignes, calcul des totaux) est aligné sur le schéma Prisma du Backend (`Devis`/`Facture`/`DevisLigne`/`FactureLigne`) pour permettre un branchement direct, sans couche de traduction.

## Stack technique

- **Python 3.12 (64-bit)**
- **Jinja2** — moteur de templates pour injecter dynamiquement les données dans le HTML
- **WeasyPrint** — conversion HTML/CSS → PDF
- **Pillow** — validation et redimensionnement automatique des logos
- **Requests** — appel de l'endpoint Backend pour les règles légales par pays (avec fallback mocké)
- **Decimal (stdlib)** — tous les calculs monétaires (`calcul.py`) utilisent `decimal.Decimal`, jamais `float`, pour éviter les erreurs d'arrondi
- **FastAPI + Uvicorn** — service HTTP (`api.py`) exposant la génération PDF au Backend NestJS (Python et Node ne partagent pas de runtime)

## Structure du projet

```
Génération de Documents (PDF)/
├── config.py                  # Chemins, configuration (assets, output) et BACKEND_RULES_ENDPOINT
├── requirements.txt           # Dépendances Python
├── calcul.py                  # Calcul des lignes/totaux (TVA multi-taux, remises), miroir du CalculService Backend
├── pdf_service.py             # generer_pdf(donnees, template_type, personnalisation) — point d'entrée générique
├── generate_invoice.py        # Wrapper facture autour de pdf_service.generer_pdf()
├── generate_quote.py          # Wrapper devis autour de pdf_service.generer_pdf()
├── avoir.py                   # generer_avoir(donnees_facture, motif) — inverse une facture en facture d'avoir
├── personalization.py         # Validation + traitement logo/couleurs
├── legal_mentions.py          # Récupération des mentions légales par pays (mock + Backend)
├── backend_mapping.py         # Traduit la réponse Prisma brute du Backend vers le format de ce module
├── api.py                     # Service HTTP (FastAPI) exposé au Backend NestJS
├── test_pdf.py                # Test initial (validation de l'environnement PDF)
├── test_personalization.py    # Tests logo/couleurs (plusieurs combinaisons)
├── test_legal_mentions.py     # Tests mentions légales (plusieurs pays)
├── test_avoir.py              # Tests génération d'avoir (montants inversés, motifs, erreurs)
├── test_api.py                # Tests d'intégration Backend (mapping + endpoints HTTP, données simulées)
├── test_end_to_end.py         # Test bout-en-bout contre un vrai Backend NestJS local (voir section dédiée)
├── templates/
│   ├── invoice.html           # Template HTML/CSS de la facture
│   └── devis.html             # Template HTML/CSS du devis
├── assets/
│   ├── fonts/                  # Polices personnalisées (optionnel)
│   └── images/                  # Logos originaux et redimensionnés
├── output/                    # PDF générés (ignoré par Git)
└── venv/                      # Environnement virtuel (ignoré par Git)
```

## Installation

1. Cloner le repo :
```bash
git clone https://github.com/Majdi-Abi-Dhiaf/facturation-generation-pdf.git
cd facturation-generation-pdf
```

2. Créer et activer un environnement virtuel (Python 64-bit requis) :
```bash
py -3.12 -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # macOS/Linux
```

3. Installer les dépendances :
```bash
pip install -r requirements.txt
```

4. **Windows uniquement** : WeasyPrint nécessite le runtime GTK3 (Pango, Cairo, GObject).
   Installer la version correspondant à l'architecture de ton Python (64-bit) :
   https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer/releases

5. **Optionnel** : pour brancher les vraies règles légales du Backend au lieu du mock, définir la variable d'environnement `BACKEND_RULES_ENDPOINT` (ex: `http://localhost:3001/api/pays/regles`).

## Utilisation

### Générer une facture
```bash
python generate_invoice.py
```
→ `output/facture.pdf`

### Générer un devis
```bash
python generate_quote.py
```
→ `output/devis.pdf`

### Lancer les tests
```bash
python test_personalization.py    # combinaisons logo/couleurs
python test_legal_mentions.py     # plusieurs pays (FR, BE, TN, LU)
python test_avoir.py              # montants inversés, plusieurs motifs, cas d'erreur
```

### Générer une facture d'avoir

```python
from avoir import generer_avoir
from pdf_service import generer_pdf

avoir = generer_avoir(donnees_facture, motif="Produit défectueux, remboursement intégral")
chemin = generer_pdf(avoir, "FACTURE", nom_fichier="avoir.pdf")
```

`generer_avoir()` reprend les données de la facture source, inverse le montant de chaque ligne (via la quantité, pas le prix unitaire — une ligne `REMISE` doit garder un prix négatif ou nul, donc seule la quantité change de signe), et ajoute `numero` (`AV-<numero d'origine>`), `facture_origine_numero`, `est_avoir` et `motif_avoir`. Le template facture affiche alors "FACTURE D'AVOIR", la référence à la facture d'origine et le motif.

### Appel générique par le Backend

`generate_invoice_pdf()` / `generate_quote_pdf()` sont de simples wrappers autour du point d'entrée générique `pdf_service.generer_pdf()`, pensé pour être appelé directement par le Backend :

```python
from pdf_service import generer_pdf, PdfGenerationError

try:
    pdf_bytes = generer_pdf(donnees, "FACTURE", retour="bytes")   # pour une réponse HTTP
    # ou : chemin = generer_pdf(donnees, "FACTURE", nom_fichier="facture.pdf")  # écrit sur disque
except PdfGenerationError as e:
    ...  # un seul type d'erreur à gérer, quelle que soit la cause d'origine
```

### Format des données attendu (facture)

```python
data = {
    "company_name": "Atelier Bois & Co",
    "company_matricule_fiscal": "1234567A",   # optionnel — identifiant fiscal (ex: Tunisie)
    "company_siret": None,                    # optionnel — SIRET (ex: France)
    "company_address": "12 rue des Artisans, 75011 Paris",
    "logo_path": None,                 # chemin vers un logo (PNG/JPG/SVG), optionnel
    "primary_color": "#1D9E75",
    "secondary_color": "#555555",
    "pays_code": "FR",                 # optionnel — auto-remplit legal_mentions via fetch_mentions_legales()
    "numero": "FAC-2026-0142",
    "date_emission": "15/07/2026",
    "date_echeance": "14/08/2026",
    "devise": "EUR",
    "client_name": "Julie Marchand",
    "client_address": "Tunis, Tunisie",
    "client_raison_sociale": None,     # optionnel — client B2B
    "client_siret": None,              # optionnel
    "client_matricule_fiscal": None,   # optionnel
    "lignes": [
        {
            "description": "Table sur mesure chêne",
            "quantite": 1,
            "prix_unitaire_ht": 450.00,
            "taux_tva": 20,             # en %, propre à chaque ligne (facture multi-taux)
            "type_ligne": "PRODUIT",    # PRODUIT | SERVICE | REMISE
        },
        {
            "description": "Livraison et installation",
            "quantite": 1,
            "prix_unitaire_ht": 60.00,
            "taux_tva": 10,
            "type_ligne": "SERVICE",
        },
    ],
    # "legal_mentions": "...",  # optionnel — écrase l'auto-remplissage via pays_code
}
```

Une ligne peut aussi arriver **déjà calculée** par le Backend (`montant_ht`, `montant_tva`, `montant_ttc` fournis) : dans ce cas `calcul.py` ne recalcule rien et fait confiance à l'arrondi du Backend, pour ne jamais diverger.

Une ligne `REMISE` (remise/rabais) a un `prix_unitaire_ht` négatif ou nul, réduit le sous-total HT, mais est **exonérée de TVA** : elle ne génère aucune taxe et n'apparaît dans aucun groupe de TVA affiché.

### Format des données attendu (devis)

Même structure que la facture, avec `numero`/`date_creation`/`date_validite` à la place de `numero`/`date_emission`/`date_echeance`, et quelques champs propres au devis :

```python
data = {
    "company_name": "Atelier Bois & Co",
    "company_siret": "123 456 789 00012",
    "company_matricule_fiscal": None,
    "company_address": "12 rue des Artisans, 75011 Paris",
    "logo_path": None,
    "primary_color": "#1D9E75",
    "secondary_color": "#555555",
    "numero": "DEV-2026-0087",
    "quote_status": "En attente",      # affiché en badge dans l'en-tête
    "date_creation": "20/07/2026",
    "date_validite": "20/08/2026",
    "devise": "EUR",
    "client_name": "Julie Marchand",
    "client_address": "Tunis, Tunisie",
    "intro_message": "Merci pour votre demande. Voici notre proposition détaillée...",
    "lignes": [
        {"description": "Table sur mesure chêne", "quantite": 1, "prix_unitaire_ht": 450.00, "taux_tva": 20, "type_ligne": "PRODUIT"},
        {"description": "Livraison et installation", "quantite": 1, "prix_unitaire_ht": 60.00, "taux_tva": 10, "type_ligne": "SERVICE"},
    ],
    "payment_conditions": "30% d'acompte à la commande, solde à la livraison.",
    "acceptance_conditions": "Ce devis est valable 30 jours à compter de sa date d'émission.",
}
```

## Intégration Backend (NestJS)

Python et Node ne partagent pas de runtime : le Backend ne peut pas importer ce module directement. `api.py` expose donc la génération PDF en HTTP via FastAPI, pensé pour que **le Backend n'ait rien à mapper de son côté** — il envoie sa réponse Prisma brute telle quelle, `backend_mapping.py` fait la traduction en interne.

### Lancer le service

```bash
uvicorn api:app --reload --port 8000
```

### Endpoints

| Route | Body attendu | Retourne |
|---|---|---|
| `GET /health` | — | `{"status": "ok"}` |
| `POST /pdf/facture` | Réponse de `GET /factures/:id`, + `entreprise`/`pays` ajoutés dedans par l'appelant (voir écart connu) | PDF (`application/pdf`) |
| `POST /pdf/devis` | Réponse de `GET /devis/:id`, + `entreprise`/`pays` ajoutés dedans par l'appelant (idem) | PDF |
| `POST /pdf/facture/avoir` | `{"facture": <réponse facture>, "motif": "..."}` | PDF de l'avoir |

Exemple d'appel côté NestJS (`FactureController`) :

```ts
const facture = await this.factureService.findOneWithDetails(entrepriseId, id);
const reponse = await axios.post('http://localhost:8000/pdf/facture', facture, {
  responseType: 'arraybuffer',
});
res.set('Content-Type', 'application/pdf').send(reponse.data);
```

### ⚠️ Écart confirmé sur un vrai Backend local : ni facture ni devis n'incluent `entreprise`/`pays`

Vérifié en conditions réelles (Backend NestJS + PostgreSQL lancés en local, utilisateur/entreprise/client/facture créés via l'API, puis `GET /factures/1` appelé pour de vrai) : la réponse ne contient que `facture_ligne`, `client`, `paiement` — ni `entreprise` ni `pays`. `FactureService.findOneWithDetails()` les inclurait bien, mais **aucune route du controller ne l'appelle** ; seul `findOne()` (sans ces relations) est exposé. Même situation, déjà connue, côté `DevisService.findOne()`.

En attendant que Fahd ajoute `entreprise: true` et `pays: true` aux deux `include` (le plus simple, et suffisant), `mapper_facture()`/`mapper_devis()` acceptent `entreprise`/`pays` en paramètres séparés — donc pour l'instant, l'appelant (ou un futur endpoint Backend dédié) doit les récupérer via `GET /entreprises/:id` et les injecter dans la réponse avant de l'envoyer à `/pdf/facture` ou `/pdf/devis`, sans quoi l'API répond `422`.

### Lancer les tests d'intégration

```bash
python test_api.py
```
Simule une réponse Backend réaliste (mêmes noms de champs que `prisma/schema.prisma`, Decimal sérialisés en chaînes comme le fait Prisma), teste le mapping, les 3 endpoints PDF, et le cas d'erreur (réponse incomplète → 422 explicite).

### Test bout-en-bout contre un vrai Backend

`test_end_to_end.py` ne simule rien : il pilote un vrai Backend NestJS local (PostgreSQL + `npm run start:dev`) via son API HTTP réelle — login, création d'un client, création d'une facture, récupération, fusion avec l'entreprise, puis génération du PDF via `api.py`. Utile pour vérifier que le mapping tient face à de vraies données, pas seulement au fixture de `test_api.py`.

Prérequis : Backend lancé sur `:3001`, ce service PDF lancé sur `:8001` (`uvicorn api:app --port 8001`), un utilisateur/entreprise déjà créés (voir identifiants en tête de fichier).

```bash
python test_end_to_end.py
```
→ `output/facture_reelle_backend.pdf`, généré à partir de données réellement stockées en base, pas d'un mock.

**Écrit en Python (`requests`) plutôt qu'en curl/PowerShell** : `Invoke-WebRequest` sous Windows PowerShell s'est révélé peu fiable pour ce genre d'appel (cookies `SameSite=Strict` silencieusement perdus, `localhost` résolu en IPv6 sans rien en écoute, requêtes qui restent bloquées sur des payloads JSON non triviaux). `requests` n'a aucun de ces problèmes.

## Comment ça fonctionne

1. `pdf_service.generer_pdf(donnees, template_type, personnalisation)` est le point d'entrée : il valide `template_type` (`FACTURE`/`DEVIS`) et les champs obligatoires, puis orchestre les étapes suivantes
2. `personalization.py` valide et traite le logo (redimensionnement automatique, conversion en URI `file://` pour WeasyPrint) et les couleurs (format hexadécimal)
3. `legal_mentions.py` récupère le taux de TVA, le libellé de l'identifiant fiscal et les mentions légales obligatoires selon `pays_code` — via l'endpoint Backend si `BACKEND_RULES_ENDPOINT` est configuré, sinon via des données mockées (FR, BE, TN, LU) — et remplit automatiquement le pied de page si `legal_mentions` n'a pas été fourni explicitement
4. `calcul.py` calcule chaque ligne (arrondi à 2 décimales, `REMISE` exonérée de TVA), les totaux du document (`total_ht`, `total_tva`, `total_ttc`), et regroupe les lignes taxables par taux de TVA pour l'affichage détaillé (facture multi-taux)
5. Le template HTML (`invoice.html` ou `devis.html`) contient les placeholders Jinja2 (`{{ numero }}`, `{{ client_name }}`, `{% for ligne in lignes %}`, etc.) ; `pdf_service` y injecte toutes les données puis WeasyPrint convertit le HTML/CSS final en PDF (bytes en mémoire ou fichier sur disque, selon `retour`)
6. Toute erreur d'une étape (paramètres invalides, logo/couleur, ligne incohérente, pays non supporté, échec de rendu) est journalisée puis remontée à l'appelant sous une unique `PdfGenerationError`

## Gestion des erreurs

Chaque module lève son propre type d'exception si on l'utilise directement ; en passant par `pdf_service.generer_pdf()`, tout est unifié en `PdfGenerationError`.

| Module | Exception | Levée quand |
|---|---|---|
| `personalization.py` | `PersonalizationError` | logo introuvable/corrompu/format non supporté, couleur non hexadécimale |
| `calcul.py` | `CalculError` | `type_ligne` invalide, prix incohérent avec le type (ex: `REMISE` avec prix positif) |
| `legal_mentions.py` | `LegalMentionsError` | pays non supporté (ni par le Backend, ni par le mock) |
| `avoir.py` | `AvoirError` | motif vide, facture source sans `numero` ou sans lignes |
| `pdf_service.py` | `PdfGenerationError` | `template_type` invalide, champ obligatoire manquant, ou toute exception ci-dessus survenue pendant `generer_pdf()` |
| `backend_mapping.py` | `MappingError` | champ manquant dans la réponse Backend (`entreprise`, `client`, etc.) |

`api.py` intercepte `MappingError`/`PdfGenerationError`/`AvoirError` et renvoie un `422` avec le message d'erreur — jamais un `500` opaque pour une donnée d'entrée invalide.

## Mentions légales mockées (fallback sans Backend)

Tant que `BACKEND_RULES_ENDPOINT` n'est pas configuré, `legal_mentions.py` sert ces valeurs :

| Pays | Taux TVA | Libellé identifiant fiscal | Devise |
|---|---|---|---|
| FR | 20% | SIRET | EUR |
| BE | 21% | Numéro de TVA (BCE) | EUR |
| TN | 19% | Matricule Fiscal | TND |
| LU | 17% | Numéro de TVA | EUR |

## État d'avancement

- [x] Configurer la bibliothèque de génération PDF (WeasyPrint + Jinja2, environnement 64-bit)
- [x] Créer le template de facture personnalisable
- [x] Créer le template de devis personnalisable
- [x] Ajouter la personnalisation logos et couleurs
  - [x] Validation logo (existence, format, intégrité) + couleurs (hexadécimal)
  - [x] Redimensionnement automatique du logo (max 200x200 px) + conversion URI `file://`
  - [x] Testé avec plusieurs logos et combinaisons de couleurs
- [x] Intégrer les mentions légales par pays
  - [x] `fetch_mentions_legales(pays_code)` avec fallback mock (FR, BE, TN, LU)
  - [x] Sélection dynamique du taux de TVA et du libellé (SIRET/TVA/Matricule Fiscal) selon le pays
  - [x] Testé avec plusieurs pays différents
- [x] Gérer la TVA multi-taux par ligne et les lignes de remise (exonérées de TVA)
- [x] Développer le service de génération PDF générique
  - [x] `generer_pdf(donnees, template_type, personnalisation)` avec validation des paramètres
  - [x] Moteur de template (remplacement des placeholders, formatage des montants) via `pdf_service.py`
  - [x] Gestion des erreurs (`PdfGenerationError` unique), logging, retour en `bytes` ou fichier selon les besoins Backend
- [x] Implémenter la génération de factures d'avoir
  - [x] `generer_avoir(donnees_facture, motif, montants_inverses)` qui prépare les données inversées
  - [x] Template facture adapté ("FACTURE D'AVOIR", montants négatifs, référence à la facture initiale)
  - [x] Testé avec plusieurs motifs, montants et références vérifiés
- [x] Construire l'intégration Backend (service HTTP + mapping)
  - [x] `api.py` (FastAPI) exposant `/pdf/facture`, `/pdf/devis`, `/pdf/facture/avoir`
  - [x] `backend_mapping.py` traduisant la réponse Prisma brute vers le format attendu, sans mapping côté Backend
  - [x] Support des logos `logo_url` distants (URL Backend, pas un fichier local)
  - [x] Testé avec une réponse Backend réaliste (`test_api.py`) + serveur réel (`curl`)
  - [x] Testé contre un vrai Backend local (`test_end_to_end.py` : PostgreSQL + NestJS lancés, données créées et récupérées via l'API réelle) — a révélé que `entreprise`/`pays` manquent aussi sur `GET /factures/:id`, pas seulement sur le devis
- [ ] Écrire les tests unitaires et fonctionnels (au-delà des scripts de test manuels actuels)
- [ ] Brancher `BACKEND_RULES_ENDPOINT` sur le vrai endpoint dès qu'il existe côté Backend (non disponible à ce jour)

## Limites connues / à valider avec le Backend

- **`BACKEND_RULES_ENDPOINT` n'existe pas encore côté Backend.** Le Prisma schema a bien les tables `MentionLegale`/`TauxTva` scoped par `Pays`, mais aucun controller ne les expose encore via HTTP — et aucune route ne liste les `Pays` non plus. En attendant, `legal_mentions.py` tourne uniquement en mode mock (FR/BE/TN/LU).
- **`GET /factures/:id` et `GET /devis/:id` n'incluent ni `entreprise` ni `pays`** — confirmé contre un vrai Backend local, pas seulement supposé (voir section Intégration Backend ci-dessus). `FactureService.findOneWithDetails()` les inclurait, mais n'est appelée par aucune route. `POST /pdf/facture`/`/pdf/devis` échouent en 422 tant que l'appelant ne les fournit pas séparément.
- **Aucun champ `primary_color`/`secondary_color` dans le schéma Backend.** `Entreprise` n'a que `logo_url`. La personnalisation couleur n'a donc rien à persister côté Backend pour l'instant.
- **`api.py` n'a pas encore été appelé par du vrai code NestJS** — testé avec des données réelles créées via l'API du Backend (voir ci-dessus), mais toujours en simulant côté Python l'appel HTTP qu'un futur controller NestJS ferait.

## Notes techniques

- WeasyPrint sur Windows nécessite impérativement une correspondance d'architecture entre Python et le runtime GTK3 (32-bit avec 32-bit, 64-bit avec 64-bit), sous peine d'erreur `OSError: cannot load library 'libgobject-2.0-0'`.
- Les chemins de logo doivent être convertis en URI `file:///` (via `pathlib.Path.as_uri()`) avant d'être injectés dans le HTML, sinon WeasyPrint ne les affiche pas correctement sur Windows (chemins avec espaces/accents).
- `legal_mentions.py` est conçu pour basculer automatiquement du mode mock au vrai endpoint Backend dès que `BACKEND_RULES_ENDPOINT` est défini (même structure de données en sortie dans les deux cas).
- `calcul.py` est un miroir volontaire de `CalculService` côté Backend (NestJS) : même arrondi ligne par ligne (2 décimales), même règle de cohérence `REMISE` ↔ prix négatif. Objectif : que les totaux calculés ici correspondent toujours à ceux stockés côté Backend.
- Le module est pensé pour être appelé directement par le Backend (fonction réutilisable), pas comme une interface utilisateur autonome.
