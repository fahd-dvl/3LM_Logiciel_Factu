import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TypeDocument } from '../enums/type-document.enum';

@Injectable()
export class NumerotationService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly prefixes: Record<TypeDocument, string> = {
    [TypeDocument.DEVIS]: 'DEV',
    [TypeDocument.FACTURE]: 'FAC',
  };

  /**
   * Génère le prochain numéro séquentiel pour une entreprise/type/année.
   * Atomique : utilise un upsert avec increment pour éviter les doublons
   * en cas d'appels concurrents, grâce à la contrainte unique
   * [entreprise_id, type_document, annee].
   */
  async genererNumero(
    entrepriseId: number,
    type: TypeDocument,
  ): Promise<string> {
    const annee = new Date().getFullYear();

    const compteur = await this.prisma.$transaction(async (tx) => {
      return tx.compteurNumerotation.upsert({
        where: {
          entreprise_id_type_document_annee: {
            entreprise_id: entrepriseId,
            type_document: type,
            annee,
          },
        },
        create: {
          entreprise_id: entrepriseId,
          type_document: type,
          annee,
          dernier_numero: 1,
        },
        update: {
          dernier_numero: { increment: 1 },
        },
      });
    });

    if (!compteur) {
      throw new BadRequestException(
        'Impossible de générer le numéro de document',
      );
    }

    const prefix = this.prefixes[type];
    const numeroFormate = compteur.dernier_numero.toString().padStart(4, '0');

    return `${prefix}-${annee}-${numeroFormate}`;
  }
}
