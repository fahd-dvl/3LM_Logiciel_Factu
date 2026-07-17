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
   * Génère le prochain numéro séquentiel pour un utilisateur/type/année.
   * Atomique : utilise une transaction avec upsert + increment pour éviter
   * les doublons en cas d'appels concurrents.
   */
  async genererNumero(
    utilisateurId: number,
    type: TypeDocument,
  ): Promise<string> {
    const annee = new Date().getFullYear();

    const compteur = await this.prisma.$transaction(async (tx) => {
      // upsert atomique : crée le compteur à 1 s'il n'existe pas,
      // sinon incrémente. Postgres garantit l'atomicité de cette opération
      // grâce à la contrainte unique [utilisateur_id, type_document, annee].
      return tx.compteurNumerotation.upsert({
        where: {
          utilisateur_id_type_document_annee: {
            utilisateur_id: utilisateurId,
            type_document: type,
            annee,
          },
        },
        create: {
          utilisateur_id: utilisateurId,
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
