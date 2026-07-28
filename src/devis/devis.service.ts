import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculService } from '../common/services/calcul.service';
import { NumerotationService } from '../common/services/numerotation.service';
import { TypeDocument } from '../common/enums/type-document.enum';
import { CreateDevisDto } from './dto/create-devis.dto';
import { UpdateDevisDto } from './dto/update-devis.dto';
import { verifierTransition, estModifiable } from './devis-statut.machine';
import { StatutDevis } from 'generated/prisma/enums';

@Injectable()
export class DevisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculService: CalculService,
    private readonly numerotationService: NumerotationService,
  ) {}

  async creer(entrepriseId: number, dto: CreateDevisDto) {
    const numero = await this.numerotationService.genererNumero(
      entrepriseId,
      TypeDocument.DEVIS,
    );

    const lignesCalculees = this.calculService.preparerLignes(dto.lignes);
    const totaux = this.calculService.calculerTotaux(lignesCalculees);

    return this.prisma.devis.create({
      data: {
        entreprise_id: entrepriseId,
        client_id: dto.client_id,
        pays_id: dto.pays_id,
        numero,
        date_validite: new Date(dto.date_validite),
        devise: dto.devise,
        statut: 'BROUILLON',
        ...totaux,
        devis_ligne: {
          create: lignesCalculees,
        },
      },
      include: { devis_ligne: true },
    });
  }

  async findAll(entrepriseId: number, statut?: StatutDevis) {
    return this.prisma.devis.findMany({
      where: {
        entreprise_id: entrepriseId,
        ...(statut ? { statut } : {}),
      },
      orderBy: { date_creation: 'desc' },
    });
  }

  async findOne(entrepriseId: number, id: number) {
    const devis = await this.prisma.devis.findFirst({
      where: { id, entreprise_id: entrepriseId },
      include: { devis_ligne: true, client: true },
    });

    if (!devis) {
      throw new NotFoundException('Devis introuvable');
    }

    return devis;
  }

  async update(entrepriseId: number, id: number, dto: UpdateDevisDto) {
    const devis = await this.findOne(entrepriseId, id);

    if (!estModifiable(devis.statut)) {
      throw new BadRequestException(
        `Impossible de modifier un devis au statut ${devis.statut}`,
      );
    }

    if (dto.lignes) {
      const lignesCalculees = this.calculService.preparerLignes(dto.lignes);
      const totaux = this.calculService.calculerTotaux(lignesCalculees);

      return this.prisma.devis.update({
        where: { id },
        data: {
          ...(dto.client_id && { client_id: dto.client_id }),
          ...(dto.date_validite && {
            date_validite: new Date(dto.date_validite),
          }),
          ...(dto.devise && { devise: dto.devise }),
          ...totaux,
          devis_ligne: {
            deleteMany: {},
            create: lignesCalculees,
          },
        },
        include: { devis_ligne: true },
      });
    }

    return this.prisma.devis.update({
      where: { id },
      data: {
        ...(dto.client_id && { client_id: dto.client_id }),
        ...(dto.date_validite && {
          date_validite: new Date(dto.date_validite),
        }),
        ...(dto.devise && { devise: dto.devise }),
      },
      include: { devis_ligne: true },
    });
  }

  async changerStatut(
    entrepriseId: number,
    id: number,
    nouveauStatut: StatutDevis,
  ) {
    const devis = await this.findOne(entrepriseId, id);

    verifierTransition(devis.statut, nouveauStatut);

    return this.prisma.devis.update({
      where: { id },
      data: { statut: nouveauStatut },
    });
  }

  async remove(entrepriseId: number, id: number) {
    const devis = await this.findOne(entrepriseId, id);

    if (devis.statut !== 'BROUILLON') {
      throw new BadRequestException(
        'Seul un devis en brouillon peut être supprimé',
      );
    }

    return this.prisma.devis.delete({ where: { id } });
  }

  async verifierExpirations() {
    return this.prisma.devis.updateMany({
      where: {
        date_validite: { lt: new Date() },
        statut: { in: ['BROUILLON', 'ENVOYE'] },
      },
      data: { statut: 'EXPIRE' },
    });
  }
}
