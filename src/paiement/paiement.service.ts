import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../prisma/prisma.service';
import { FactureService } from '../facture/facture.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';

@Injectable()
export class PaiementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly factureService: FactureService,
  ) {}

  /**
   * Enregistre un paiement sur une facture, avec toutes les validations
   * métier, puis recalcule le statut de la facture — le tout dans une
   * transaction pour garantir la cohérence.
   */
  async creer(utilisateurId: number, dto: CreatePaiementDto) {
    return this.prisma.$transaction(async (tx) => {
      const facture = await tx.facture.findFirst({
        where: { id: dto.facture_id, utilisateur_id: utilisateurId },
        include: { paiement: true },
      });

      if (!facture) {
        throw new NotFoundException('Facture introuvable');
      }

      if (facture.statut === 'BROUILLON') {
        throw new BadRequestException(
          "Impossible d'enregistrer un paiement sur une facture en brouillon : elle doit d'abord être envoyée",
        );
      }

      if (facture.statut === 'ANNULEE') {
        throw new BadRequestException(
          "Impossible d'enregistrer un paiement sur une facture annulée",
        );
      }

      if (facture.statut === 'PAYEE') {
        throw new BadRequestException(
          'Cette facture est déjà entièrement payée',
        );
      }

      const totalDejaPaye = facture.paiement.reduce(
        (acc, p) => acc.plus(p.montant),
        new Decimal(0),
      );

      const resteAPayer = facture.total_ttc.minus(totalDejaPaye);
      const montantPaiement = new Decimal(dto.montant);

      if (montantPaiement.gt(resteAPayer)) {
        throw new BadRequestException(
          `Le montant du paiement (${montantPaiement.toFixed(2)}) dépasse le reste à payer (${resteAPayer.toFixed(2)})`,
        );
      }

      const paiement = await tx.paiement.create({
        data: {
          facture_id: dto.facture_id,
          montant: montantPaiement,
          methode: dto.methode,
          reference: dto.reference,
        },
      });

      await this.factureService.recalculerStatutPaiement(dto.facture_id, tx);

      return paiement;
    });
  }

  async findAllByFacture(utilisateurId: number, factureId: number) {
    const facture = await this.prisma.facture.findFirst({
      where: { id: factureId, utilisateur_id: utilisateurId },
    });

    if (!facture) {
      throw new NotFoundException('Facture introuvable');
    }

    return this.prisma.paiement.findMany({
      where: { facture_id: factureId },
      orderBy: { date_paiement: 'desc' },
    });
  }

  async findOne(utilisateurId: number, id: number) {
    const paiement = await this.prisma.paiement.findFirst({
      where: {
        id,
        facture: { utilisateur_id: utilisateurId },
      },
      include: { facture: true },
    });

    if (!paiement) {
      throw new NotFoundException('Paiement introuvable');
    }

    return paiement;
  }

  /**
   * Annule un paiement (ex: erreur de saisie) et recalcule le statut
   * de la facture en conséquence. Interdit si la facture est déjà PAYEE
   * ou ANNULEE, pour ne jamais modifier un historique définitif.
   */
  async remove(utilisateurId: number, id: number) {
    return this.prisma.$transaction(async (tx) => {
      const paiement = await tx.paiement.findFirst({
        where: { id, facture: { utilisateur_id: utilisateurId } },
        include: { facture: true },
      });

      if (!paiement) {
        throw new NotFoundException('Paiement introuvable');
      }

      if (['PAYEE', 'ANNULEE'].includes(paiement.facture.statut)) {
        throw new BadRequestException(
          `Impossible de supprimer un paiement d'une facture au statut ${paiement.facture.statut}`,
        );
      }

      await tx.paiement.delete({ where: { id } });
      await this.factureService.recalculerStatutPaiement(
        paiement.facture_id,
        tx,
      );

      return { message: 'Paiement supprimé' };
    });
  }
}
