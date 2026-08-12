"""
Service HTTP exposant la génération de PDF au Backend (NestJS), pour franchir
la frontière Python/Node : le Backend envoie sa réponse Prisma brute (celle de
findOneWithDetails() ou équivalent), reçoit un PDF en retour. Toute la
traduction (backend_mapping.py) et l'orchestration (pdf_service.py) restent
internes à ce service — rien à mapper côté Backend.

Lancer en local :
    uvicorn api:app --reload --port 8000

Endpoints :
    GET  /health              — vérifie que le service tourne
    POST /pdf/facture         — body = réponse Backend d'une facture -> PDF
    POST /pdf/devis           — body = réponse Backend d'un devis -> PDF
    POST /pdf/facture/avoir   — body = {"facture": ..., "motif": "..."} -> PDF
"""

from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from avoir import AvoirError, generer_avoir
from backend_mapping import MappingError, mapper_devis, mapper_facture
from pdf_service import PdfGenerationError, generer_pdf

app = FastAPI(title="Service de génération PDF — 3LM Solutions")


class AvoirRequest(BaseModel):
    facture: dict
    motif: str


def _pdf_response(pdf_bytes: bytes, nom_fichier: str) -> Response:
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{nom_fichier}"'},
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/pdf/facture")
def pdf_facture(facture_backend: dict):
    try:
        donnees = mapper_facture(facture_backend)
        pdf_bytes = generer_pdf(donnees, "FACTURE", retour="bytes")
    except (MappingError, PdfGenerationError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    return _pdf_response(pdf_bytes, f"{donnees['numero']}.pdf")


@app.post("/pdf/facture/avoir")
def pdf_facture_avoir(payload: AvoirRequest):
    try:
        donnees = mapper_facture(payload.facture)
        avoir = generer_avoir(donnees, motif=payload.motif)
        pdf_bytes = generer_pdf(avoir, "FACTURE", retour="bytes")
    except (MappingError, AvoirError, PdfGenerationError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    return _pdf_response(pdf_bytes, f"{avoir['numero']}.pdf")


@app.post("/pdf/devis")
def pdf_devis(devis_backend: dict):
    try:
        donnees = mapper_devis(devis_backend)
        pdf_bytes = generer_pdf(donnees, "DEVIS", retour="bytes")
    except (MappingError, PdfGenerationError) as e:
        raise HTTPException(status_code=422, detail=str(e))
    return _pdf_response(pdf_bytes, f"{donnees['numero']}.pdf")
