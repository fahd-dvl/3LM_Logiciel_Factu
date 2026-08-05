import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { StatutDepense } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CalculService } from '../common/services/calcul.service';
import { FournisseurService } from '../fournisseur/fournisseur.service';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { UpdateDepenseDto } from './dto/update-depense.dto';

export interface FiltresDepense {
  fournisseur_id?: number;
  categorie_id?: number;
  statut?: StatutDepense;
  date_debut?: string;
  date_fin?: string;
}

@Injectable()
export class DepenseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculService: CalculService,
    private readonly fournisseurService: FournisseurService,
  ) {}

  async create(dto: CreateDepenseDto, entrepriseId: number) {
    await this.fournisseurService.findOne(dto.fournisseur_id, entrepriseId);

    if (dto.categorie_id) {
      const categorie = await this.prisma.categorie.findFirst({
        where: { id: dto.categorie_id, entreprise_id: entrepriseId },
      });
      if (!categorie) {
        throw new NotFoundException(
          'Catégorie non trouvée pour cette entreprise',
        );
      }
    }

    const montants = this.calculService.calculerDepense(
      dto.montant_ht,
      dto.taux_tva,
    );

    return this.prisma.depense.create({
      data: {
        entreprise_id: entrepriseId,
        fournisseur_id: dto.fournisseur_id,
        categorie_id: dto.categorie_id,
        description: dto.description,
        date_depense: new Date(dto.date_depense),
        date_echeance: dto.date_echeance ? new Date(dto.date_echeance) : null,
        reference_facture: dto.reference_facture,
        montant_ht: montants.montant_ht,
        taux_tva: dto.taux_tva,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        tva_recuperable: dto.tva_recuperable ?? true,
        mode_paiement: dto.mode_paiement,
        justificatif_url: dto.justificatif_url,
        statut: 'A_PAYER',
      },
      include: { fournisseur: true, categorie: true },
    });
  }

  async findOne(id: number, entrepriseId: number) {
    const depense = await this.prisma.depense.findFirst({
      where: { id, entreprise_id: entrepriseId },
      include: { fournisseur: true, categorie: true },
    });

    if (!depense) {
      throw new NotFoundException('Dépense introuvable');
    }

    return depense;
  }

  async findAll(entrepriseId: number, filtres: FiltresDepense) {
    return this.prisma.depense.findMany({
      where: {
        entreprise_id: entrepriseId,
        ...(filtres.fournisseur_id && {
          fournisseur_id: filtres.fournisseur_id,
        }),
        ...(filtres.categorie_id && { categorie_id: filtres.categorie_id }),
        ...(filtres.statut && { statut: filtres.statut }),
        ...(filtres.date_debut || filtres.date_fin
          ? {
              date_depense: {
                ...(filtres.date_debut && {
                  gte: new Date(filtres.date_debut),
                }),
                ...(filtres.date_fin && { lte: new Date(filtres.date_fin) }),
              },
            }
          : {}),
      },
      include: { fournisseur: true, categorie: true },
      orderBy: { date_depense: 'desc' },
    });
  }

  async update(id: number, dto: UpdateDepenseDto, entrepriseId: number) {
    const depense = await this.findOne(id, entrepriseId);

    if (dto.fournisseur_id) {
      await this.fournisseurService.findOne(dto.fournisseur_id, entrepriseId);
    }

    if (dto.categorie_id) {
      const categorie = await this.prisma.categorie.findFirst({
        where: { id: dto.categorie_id, entreprise_id: entrepriseId },
      });
      if (!categorie) {
        throw new NotFoundException(
          'Catégorie non trouvée pour cette entreprise',
        );
      }
    }

    const montantHt = dto.montant_ht ?? depense.montant_ht;
    const tauxTva = dto.taux_tva ?? depense.taux_tva;
    const montants = this.calculService.calculerDepense(montantHt, tauxTva);

    return this.prisma.depense.update({
      where: { id },
      data: {
        ...(dto.fournisseur_id && { fournisseur_id: dto.fournisseur_id }),
        ...(dto.categorie_id !== undefined && {
          categorie_id: dto.categorie_id,
        }),
        ...(dto.description && { description: dto.description }),
        ...(dto.date_depense && {
          date_depense: new Date(dto.date_depense),
        }),
        ...(dto.date_echeance !== undefined && {
          date_echeance: dto.date_echeance ? new Date(dto.date_echeance) : null,
        }),
        ...(dto.reference_facture !== undefined && {
          reference_facture: dto.reference_facture,
        }),
        montant_ht: montants.montant_ht,
        taux_tva: tauxTva,
        montant_tva: montants.montant_tva,
        montant_ttc: montants.montant_ttc,
        ...(dto.tva_recuperable !== undefined && {
          tva_recuperable: dto.tva_recuperable,
        }),
        ...(dto.mode_paiement !== undefined && {
          mode_paiement: dto.mode_paiement,
        }),
        ...(dto.justificatif_url !== undefined && {
          justificatif_url: dto.justificatif_url,
        }),
      },
      include: { fournisseur: true, categorie: true },
    });
  }

  async changerStatut(
    id: number,
    nouveauStatut: StatutDepense,
    entrepriseId: number,
  ) {
    await this.findOne(id, entrepriseId);

    return this.prisma.depense.update({
      where: { id },
      data: { statut: nouveauStatut },
      include: { fournisseur: true, categorie: true },
    });
  }

  async remove(id: number, entrepriseId: number) {
    await this.findOne(id, entrepriseId);
    return this.prisma.depense.delete({ where: { id } });
  }

  async verifierRetards() {
    return this.prisma.depense.updateMany({
      where: {
        date_echeance: { lt: new Date() },
        statut: 'A_PAYER',
      },
      data: { statut: 'EN_RETARD' },
    });
  }

  async totalParCategorie(
    entrepriseId: number,
    dateDebut?: string,
    dateFin?: string,
  ) {
    const depenses = await this.prisma.depense.findMany({
      where: {
        entreprise_id: entrepriseId,
        ...(dateDebut || dateFin
          ? {
              date_depense: {
                ...(dateDebut && { gte: new Date(dateDebut) }),
                ...(dateFin && { lte: new Date(dateFin) }),
              },
            }
          : {}),
      },
      include: { categorie: true },
    });

    const totaux = new Map<string, number>();

    for (const depense of depenses) {
      const cle = depense.categorie?.nom ?? 'Sans catégorie';
      const actuel = totaux.get(cle) ?? 0;
      totaux.set(cle, actuel + Number(depense.montant_ttc));
    }

    return Array.from(totaux.entries()).map(([categorie, total]) => ({
      categorie,
      total,
    }));
  }
}
