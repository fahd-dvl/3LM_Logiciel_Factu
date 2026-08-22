// src/taux-tva/taux-tva.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTauxTvaDto } from './dto/create-taux-tva.dto';
import { UpdateTauxTvaDto } from './dto/update-taux-tva.dto';

@Injectable()
export class TauxTvaService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Récupérer tous les taux de TVA
  async findAll() {
    return this.prisma.tauxTva.findMany({
      include: {
        pays: {
          select: {
            id: true,
            nom: true,
            code_iso: true,
          },
        },
      },
      orderBy: { taux: 'asc' },
    });
  }

  // ✅ Récupérer les taux de TVA d'un pays
  async findByPays(paysId: number) {
    const pays = await this.prisma.pays.findUnique({
      where: { id: paysId },
    });

    if (!pays) {
      throw new NotFoundException('Pays non trouvé');
    }

    const maintenant = new Date();

    return this.prisma.tauxTva.findMany({
      where: {
        pays_id: paysId,
        date_debut: { lte: maintenant },
        OR: [{ date_fin: null }, { date_fin: { gte: maintenant } }],
      },
      orderBy: { taux: 'asc' },
    });
  }

  // ✅ Récupérer les taux de TVA d'une entreprise (via son pays)
  async findByEntreprise(entrepriseId: number) {
    const entreprise = await this.prisma.entreprise.findUnique({
      where: { id: entrepriseId },
      select: { pays_id: true },
    });

    if (!entreprise) {
      throw new NotFoundException('Entreprise non trouvée');
    }

    return this.findByPays(entreprise.pays_id);
  }

  // ✅ Récupérer un taux de TVA par ID
  async findOne(id: number) {
    const tauxTva = await this.prisma.tauxTva.findUnique({
      where: { id },
      include: {
        pays: {
          select: {
            id: true,
            nom: true,
            code_iso: true,
          },
        },
      },
    });

    if (!tauxTva) {
      throw new NotFoundException('Taux de TVA non trouvé');
    }

    return tauxTva;
  }

  // ✅ Créer un taux de TVA
  async create(dto: CreateTauxTvaDto) {
    const pays = await this.prisma.pays.findUnique({
      where: { id: dto.pays_id },
    });

    if (!pays) {
      throw new NotFoundException('Pays non trouvé');
    }

    return this.prisma.tauxTva.create({
      data: {
        pays_id: dto.pays_id,
        taux: dto.taux,
        libelle: dto.libelle,
        date_debut: new Date(dto.date_debut),
        date_fin: dto.date_fin ? new Date(dto.date_fin) : null,
      },
      include: {
        pays: {
          select: {
            id: true,
            nom: true,
            code_iso: true,
          },
        },
      },
    });
  }

  // ✅ Mettre à jour un taux de TVA
  async update(id: number, dto: UpdateTauxTvaDto) {
    await this.findOne(id);

    return this.prisma.tauxTva.update({
      where: { id },
      data: {
        pays_id: dto.pays_id,
        taux: dto.taux,
        libelle: dto.libelle,
        date_debut: dto.date_debut ? new Date(dto.date_debut) : undefined,
        date_fin: dto.date_fin
          ? new Date(dto.date_fin)
          : dto.date_fin === null
            ? null
            : undefined,
      },
      include: {
        pays: {
          select: {
            id: true,
            nom: true,
            code_iso: true,
          },
        },
      },
    });
  }

  // ✅ Supprimer un taux de TVA
  async delete(id: number) {
    await this.findOne(id);

    return this.prisma.tauxTva.delete({
      where: { id },
    });
  }

  // ✅ Récupérer le taux par défaut (taux normal) d'un pays
  async findDefaultByPays(paysId: number) {
    const taux = await this.prisma.tauxTva.findFirst({
      where: {
        pays_id: paysId,
        libelle: { contains: 'normal', mode: 'insensitive' },
        date_debut: { lte: new Date() },
        OR: [{ date_fin: null }, { date_fin: { gte: new Date() } }],
      },
    });

    if (!taux) {
      // Fallback: prendre le premier taux du pays
      const allTaux = await this.findByPays(paysId);
      return allTaux.length > 0 ? allTaux[0] : null;
    }

    return taux;
  }
}
