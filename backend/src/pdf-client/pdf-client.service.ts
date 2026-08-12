import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PdfClientService {
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>(
      'PDF_SERVICE_URL',
      'http://localhost:8000',
    );
  }

  /**
   * Envoie la réponse brute de FactureService.findOne() (avec facture_ligne,
   * client, entreprise, pays inclus) au microservice Python, reçoit les
   * bytes du PDF généré. Aucun mapping n'est fait côté NestJS — toute la
   * traduction vit dans backend_mapping.py du service PDF.
   */
  async genererFacturePdf(factureData: unknown): Promise<Buffer> {
    return this.appelerServicePdf('/pdf/facture', factureData);
  }

  async genererDevisPdf(devisData: unknown): Promise<Buffer> {
    return this.appelerServicePdf('/pdf/devis', devisData);
  }

  async genererAvoirPdf(factureData: unknown, motif: string): Promise<Buffer> {
    return this.appelerServicePdf('/pdf/facture/avoir', {
      facture: factureData,
      motif,
    });
  }

  private async appelerServicePdf(
    endpoint: string,
    body: unknown,
  ): Promise<Buffer> {
    let response: globalThis.Response;

    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {
      throw new InternalServerErrorException(
        'Service de génération PDF indisponible',
      );
    }

    if (response.status === 422) {
      const erreur = await response.json().catch(() => null);
      throw new UnprocessableEntityException(
        erreur?.detail ?? 'Données invalides pour la génération du PDF',
      );
    }

    if (!response.ok) {
      throw new InternalServerErrorException(
        `Erreur du service PDF (statut ${response.status})`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
