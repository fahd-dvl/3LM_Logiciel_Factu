import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto';
import { UpdateEntrepriseDto } from './dto/update-entreprise.dto';
import { Prisma } from 'generated/prisma/client';

@Injectable()
export class EntrepriseService {
  constructor(private readonly prisma: PrismaService) {}

  async creer(utilisateurId: number, dto: CreateEntrepriseDto) {
    try {
      return await this.prisma.entreprise.create({
        data: {
          utilisateur_id: utilisateurId,
          type_structure: dto.type_structure,
          nom_entreprise: dto.nom_entreprise,
          matricule_fiscal: dto.matricule_fiscal,
          siret: dto.siret,
          adresse: dto.adresse,
          code_postal: dto.code_postal,
          ville: dto.ville,
          pays_id: dto.pays_id,
          representant_legal: dto.representant_legal,
          logo_url: dto.logo_url,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Une entreprise avec ce matricule fiscal ou ce SIRET existe déjà',
        );
      }
      throw error;
    }
  }

  async findAllByUtilisateur(utilisateurId: number) {
    return this.prisma.entreprise.findMany({
      where: { utilisateur_id: utilisateurId },
      orderBy: { nom_entreprise: 'asc' },
    });
  }

  /**
   * Récupère une entreprise précise, en vérifiant qu'elle appartient bien
   * à l'utilisateur demandeur — évite qu'un utilisateur accède aux
   * informations d'une entreprise d'un autre gérant en devinant un id.
   */
  async findOne(utilisateurId: number, id: number) {
    const entreprise = await this.prisma.entreprise.findUnique({
      where: { id },
    });

    if (!entreprise) {
      throw new NotFoundException('Entreprise introuvable');
    }

    if (entreprise.utilisateur_id !== utilisateurId) {
      throw new ForbiddenException("Vous n'avez pas accès à cette entreprise");
    }

    return entreprise;
  }

  async update(utilisateurId: number, id: number, dto: UpdateEntrepriseDto) {
    await this.findOne(utilisateurId, id); // vérifie existence + appartenance

    try {
      return await this.prisma.entreprise.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Une entreprise avec ce matricule fiscal ou ce SIRET existe déjà',
        );
      }
      throw error;
    }
  }

  /**
   * Suppression volontairement non exposée pour l'instant : une entreprise
   * qui a déjà des devis/factures ne devrait jamais être supprimable sans
   * une réflexion métier séparée (archivage plutôt que suppression, pour
   * ne jamais perdre une trace comptable légale). À réintroduire plus tard
   * si besoin, avec les bonnes garde-fous.
   */
}
