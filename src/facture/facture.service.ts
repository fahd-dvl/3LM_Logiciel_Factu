import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculService } from '../common/services/calcul.service';
import { NumerotationService } from '../common/services/numerotation.service';
import { TypeDocument } from '../common/enums/type-document.enum';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';
import {
  verifierTransitionFacture,
  estModifiableFacture,
  estSupprimableFacture,
} from './facture-statut.machine';
import { StatutFacture, Prisma } from 'generated/prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const DELAI_PAIEMENT_DEFAUT_JOURS = 30;

@Injectable()
export class FactureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculService: CalculService,
    private readonly numerotationService: NumerotationService,
  ) {}

  async creer(entrepriseId: number, dto: CreateFactureDto) {
    const numero = await this.numerotationService.genererNumero(
      entrepriseId,
      TypeDocument.FACTURE,
    );

    const lignesCalculees = this.calculService.preparerLignes(dto.lignes);
    const totaux = this.calculService.calculerTotaux(lignesCalculees);

    return this.prisma.facture.create({
      data: {
        entreprise_id: entrepriseId,
        client_id: dto.client_id,
        pays_id: dto.pays_id,
        numero,
        date_echeance: new Date(dto.date_echeance),
        devise: dto.devise,
        mode_paiement: dto.mode_paiement,
        statut: 'BROUILLON',
        ...totaux,
        facture_ligne: { create: lignesCalculees },
      },
      include: { facture_ligne: true },
    });
  }

  async creerDepuisDevis(
    entrepriseId: number,
    devisId: number,
    delaiPaiementJours?: number,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const devis = await tx.devis.findFirst({
        where: { id: devisId, entreprise_id: entrepriseId },
        include: { devis_ligne: true },
      });

      if (!devis) {
        throw new NotFoundException('Devis introuvable');
      }

      if (devis.statut !== 'ACCEPTE') {
        throw new BadRequestException(
          `Seul un devis ACCEPTE peut être converti en facture (statut actuel : ${devis.statut})`,
        );
      }

      const numero = await this.numerotationService.genererNumero(
        entrepriseId,
        TypeDocument.FACTURE,
      );

      const delai = delaiPaiementJours ?? DELAI_PAIEMENT_DEFAUT_JOURS;
      const dateEcheance = new Date();
      dateEcheance.setDate(dateEcheance.getDate() + delai);

      const facture = await tx.facture.create({
        data: {
          entreprise_id: entrepriseId,
          client_id: devis.client_id,
          pays_id: devis.pays_id,
          devis_id: devis.id,
          numero,
          date_echeance: dateEcheance,
          devise: devis.devise,
          mode_paiement: null,
          statut: 'BROUILLON',
          total_ht: devis.total_ht,
          total_tva: devis.total_tva,
          total_ttc: devis.total_ttc,
          facture_ligne: {
            create: devis.devis_ligne.map((ligne) => ({
              produit_id: ligne.produit_id,
              description: ligne.description,
              quantite: ligne.quantite,
              prix_unitaire_ht: ligne.prix_unitaire_ht,
              taux_tva: ligne.taux_tva,
              type_ligne: ligne.type_ligne,
              montant_ht: ligne.montant_ht,
              montant_tva: ligne.montant_tva,
              montant_ttc: ligne.montant_ttc,
            })),
          },
        },
        include: { facture_ligne: true },
      });

      await tx.devis.update({
        where: { id: devis.id },
        data: { statut: 'CONVERTI', date_conversion_devis: new Date() },
      });

      return facture;
    });
  }

  async findAll(entrepriseId: number, statut?: StatutFacture) {
    return this.prisma.facture.findMany({
      where: { entreprise_id: entrepriseId, ...(statut ? { statut } : {}) },
      orderBy: { date_emission: 'desc' },
    });
  }

  async findOne(entrepriseId: number, id: number) {
    const facture = await this.prisma.facture.findFirst({
      where: { id, entreprise_id: entrepriseId },
      include: {
        facture_ligne: true,
        client: { include: { pays: true } },
        paiement: true,
        entreprise: { include: { pays: true } },
        pays: true,
      },
    });

    if (!facture) {
      throw new NotFoundException('Facture introuvable');
    }

    return facture;
  }

  async update(entrepriseId: number, id: number, dto: UpdateFactureDto) {
    const facture = await this.findOne(entrepriseId, id);

    if (!estModifiableFacture(facture.statut)) {
      throw new BadRequestException(
        `Impossible de modifier une facture au statut ${facture.statut}`,
      );
    }

    if (dto.lignes) {
      const lignesCalculees = this.calculService.preparerLignes(dto.lignes);
      const totaux = this.calculService.calculerTotaux(lignesCalculees);

      return this.prisma.facture.update({
        where: { id },
        data: {
          ...(dto.client_id && { client_id: dto.client_id }),
          ...(dto.date_echeance && {
            date_echeance: new Date(dto.date_echeance),
          }),
          ...(dto.devise && { devise: dto.devise }),
          ...(dto.mode_paiement !== undefined && {
            mode_paiement: dto.mode_paiement,
          }),
          ...totaux,
          facture_ligne: {
            deleteMany: {},
            create: lignesCalculees,
          },
        },
        include: { facture_ligne: true },
      });
    }

    return this.prisma.facture.update({
      where: { id },
      data: {
        ...(dto.client_id && { client_id: dto.client_id }),
        ...(dto.date_echeance && {
          date_echeance: new Date(dto.date_echeance),
        }),
        ...(dto.devise && { devise: dto.devise }),
        ...(dto.mode_paiement !== undefined && {
          mode_paiement: dto.mode_paiement,
        }),
      },
      include: { facture_ligne: true },
    });
  }

  async changerStatut(
    entrepriseId: number,
    id: number,
    nouveauStatut: StatutFacture,
  ) {
    const facture = await this.findOne(entrepriseId, id);
    verifierTransitionFacture(facture.statut, nouveauStatut);

    return this.prisma.facture.update({
      where: { id },
      data: { statut: nouveauStatut },
    });
  }

  async remove(entrepriseId: number, id: number) {
    const facture = await this.findOne(entrepriseId, id);

    if (!estSupprimableFacture(facture.statut)) {
      throw new BadRequestException(
        'Seule une facture en brouillon peut être supprimée',
      );
    }

    return this.prisma.facture.delete({ where: { id } });
  }

  async verifierRetards() {
    return this.prisma.facture.updateMany({
      where: {
        date_echeance: { lt: new Date() },
        statut: { in: ['ENVOYEE', 'PARTIELLEMENT_PAYEE'] },
      },
      data: { statut: 'EN_RETARD' },
    });
  }

  async recalculerStatutPaiement(
    id: number,
    client: Prisma.TransactionClient | PrismaService = this.prisma,
  ) {
    const facture = await client.facture.findUnique({
      where: { id },
      include: { paiement: true },
    });

    if (!facture) {
      throw new NotFoundException('Facture introuvable');
    }

    if (['ANNULEE', 'PAYEE'].includes(facture.statut)) {
      return facture;
    }

    const totalPaye = facture.paiement.reduce(
      (acc, p) => acc.plus(p.montant),
      new Decimal(0),
    );

    let nouveauStatut: StatutFacture = facture.statut;

    if (totalPaye.gte(facture.total_ttc)) {
      nouveauStatut = 'PAYEE';
    } else if (totalPaye.gt(0)) {
      nouveauStatut = 'PARTIELLEMENT_PAYEE';
    } else {
      nouveauStatut =
        facture.statut === 'PARTIELLEMENT_PAYEE' ? 'ENVOYEE' : facture.statut;
    }

    if (nouveauStatut !== facture.statut) {
      return client.facture.update({
        where: { id },
        data: { statut: nouveauStatut },
      });
    }

    return facture;
  }

  async findOneWithDetails(entrepriseId: number, id: number) {
    const facture = await this.prisma.facture.findFirst({
      where: { id, entreprise_id: entrepriseId },
      include: {
        facture_ligne: true,
        client: { include: { pays: true } },
        entreprise: { include: { pays: true } },
        pays: true,
        paiement: { orderBy: { date_paiement: 'desc' } },
        devis: true,
      },
    });

    if (!facture) {
      throw new NotFoundException('Facture introuvable');
    }

    return facture;
  }

  async getRegroupementTva(entrepriseId: number, id: number) {
    const facture = await this.findOne(entrepriseId, id);
    return this.calculService.regrouperParTauxTva(facture.facture_ligne);
  }

  async recalculerTotaux(entrepriseId: number, id: number) {
    const facture = await this.findOne(entrepriseId, id);
    const totaux = this.calculService.calculerTotaux(facture.facture_ligne);

    return this.prisma.facture.update({
      where: { id },
      data: {
        total_ht: totaux.total_ht,
        total_tva: totaux.total_tva,
        total_ttc: totaux.total_ttc,
      },
      include: { facture_ligne: true },
    });
  }
}
