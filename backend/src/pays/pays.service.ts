import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaysService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.pays.findMany({
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: number) {
    const pays = await this.prisma.pays.findUnique({
      where: { id },
    });

    if (!pays) {
      throw new NotFoundException('Pays introuvable');
    }

    return pays;
  }

  async findByCodeIso(codeIso: string) {
    const pays = await this.prisma.pays.findUnique({
      where: { code_iso: codeIso.toUpperCase() },
    });

    if (!pays) {
      throw new NotFoundException(
        `Aucun pays trouvé pour le code ISO "${codeIso}"`,
      );
    }

    return pays;
  }

  /**
   * Retourne les règles légales d'un pays : taux de TVA actifs à la
   * date du jour et mentions légales obligatoires. Consommé par le
   * module de génération PDF via BACKEND_RULES_ENDPOINT.
   */
  async findReglesLegales(id: number) {
    const pays = await this.findOne(id);

    const maintenant = new Date();

    const tauxTva = await this.prisma.tauxTva.findMany({
      where: {
        pays_id: id,
        date_debut: { lte: maintenant },
        OR: [{ date_fin: null }, { date_fin: { gte: maintenant } }],
      },
      orderBy: { taux: 'asc' },
    });

    const mentionsLegales = await this.prisma.mentionLegale.findMany({
      where: { pays_id: id },
    });

    return {
      pays_id: pays.id,
      code_iso: pays.code_iso,
      nom: pays.nom,
      devise: pays.devise,
      taux_tva: tauxTva.map((t) => ({
        taux: t.taux,
        libelle: t.libelle,
      })),
      mentions_legales: mentionsLegales.map((m) => ({
        type: m.type,
        texte: m.texte,
      })),
    };
  }

  async findReglesByCodeIso(codeIso: string) {
    const pays = await this.findByCodeIso(codeIso);

    const regles = await this.findReglesLegales(pays.id);

    return {
      pays_code: pays.code_iso,
      devise: pays.devise,
      taux_tva: regles.taux_tva.length > 0 ? regles.taux_tva[0].taux : 0,
      libelle_identifiant_fiscal: 'ICE',
      mentions: regles.mentions_legales.map((m) => m.texte),
    };
  }
}
