// src/categorie/categorie.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';

@Injectable()
export class CategorieService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // GET - Récupérer toutes les catégories d'une entreprise
  // ============================================

  async findAll(entrepriseId: number) {
    return this.prisma.categorie.findMany({
      where: { entreprise_id: entrepriseId },
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
          },
        },
        enfants: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: { nom: 'asc' },
    });
  }

  // ============================================
  // GET - Récupérer les catégories principales (sans parent)
  // ============================================

  async findRootCategories(entrepriseId: number) {
    return this.prisma.categorie.findMany({
      where: {
        entreprise_id: entrepriseId,
        parent_id: null,
      },
      include: {
        enfants: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
      orderBy: { nom: 'asc' },
    });
  }

  // ============================================
  // GET - Récupérer les sous-catégories d'une catégorie
  // ============================================

  async findChildren(entrepriseId: number, parentId: number) {
    await this.findOne(entrepriseId, parentId);

    return this.prisma.categorie.findMany({
      where: {
        entreprise_id: entrepriseId,
        parent_id: parentId,
      },
      orderBy: { nom: 'asc' },
    });
  }

  // ============================================
  // GET - Récupérer une catégorie par ID
  // ============================================

  async findOne(entrepriseId: number, id: number) {
    const categorie = await this.prisma.categorie.findFirst({
      where: {
        id,
        entreprise_id: entrepriseId,
      },
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
          },
        },
        enfants: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    if (!categorie) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    return categorie;
  }

  // ============================================
  // POST - Créer une catégorie
  // ============================================

  async create(entrepriseId: number, dto: CreateCategorieDto) {
    // Vérifier que le parent existe si fourni
    if (dto.parent_id) {
      const parent = await this.prisma.categorie.findFirst({
        where: {
          id: dto.parent_id,
          entreprise_id: entrepriseId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Catégorie parente non trouvée');
      }

      // Empêcher une catégorie d'être son propre parent
      // (vérification côté création, l'ID n'existe pas encore)
    }

    return this.prisma.categorie.create({
      data: {
        entreprise_id: entrepriseId,
        nom: dto.nom,
        description: dto.description,
        parent_id: dto.parent_id,
      },
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
          },
        },
        enfants: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });
  }

  // ============================================
  // PUT - Mettre à jour une catégorie
  // ============================================

  async update(entrepriseId: number, id: number, dto: UpdateCategorieDto) {
    // Vérifier que la catégorie existe
    await this.findOne(entrepriseId, id);

    // Vérifier que le parent existe si fourni
    if (dto.parent_id) {
      // Empêcher une catégorie d'être son propre parent
      if (dto.parent_id === id) {
        throw new BadRequestException(
          'Une catégorie ne peut pas être son propre parent',
        );
      }

      const parent = await this.prisma.categorie.findFirst({
        where: {
          id: dto.parent_id,
          entreprise_id: entrepriseId,
        },
      });

      if (!parent) {
        throw new NotFoundException('Catégorie parente non trouvée');
      }

      // Vérifier qu'on ne crée pas une boucle (parent -> enfant -> parent)
      // Vérification simplifiée : le parent ne doit pas être un descendant
      const descendants = await this.getDescendantIds(entrepriseId, id);
      if (descendants.includes(dto.parent_id)) {
        throw new BadRequestException(
          'Impossible de définir un descendant comme parent',
        );
      }
    }

    return this.prisma.categorie.update({
      where: { id },
      data: {
        nom: dto.nom,
        description: dto.description,
        parent_id: dto.parent_id,
      },
      include: {
        parent: {
          select: {
            id: true,
            nom: true,
          },
        },
        enfants: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });
  }

  // ============================================
  // DELETE - Supprimer une catégorie
  // ============================================

  async delete(entrepriseId: number, id: number) {
    // Vérifier que la catégorie existe
    await this.findOne(entrepriseId, id);

    // Vérifier si la catégorie a des sous-catégories
    const children = await this.prisma.categorie.count({
      where: { parent_id: id },
    });

    if (children > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une catégorie qui contient des sous-catégories',
      );
    }

    // Vérifier si la catégorie est utilisée par des produits
    const produits = await this.prisma.produitService.count({
      where: { categorie_id: id },
    });

    if (produits > 0) {
      throw new BadRequestException(
        'Impossible de supprimer une catégorie qui contient des produits',
      );
    }

    return this.prisma.categorie.delete({
      where: { id },
    });
  }

  // ============================================
  // HELPER - Récupérer tous les IDs des descendants
  // ============================================

  private async getDescendantIds(
    entrepriseId: number,
    parentId: number,
  ): Promise<number[]> {
    const result: number[] = [];
    const queue: number[] = [parentId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.prisma.categorie.findMany({
        where: {
          entreprise_id: entrepriseId,
          parent_id: currentId,
        },
        select: { id: true },
      });

      const childIds = children.map((c) => c.id);
      result.push(...childIds);
      queue.push(...childIds);
    }

    return result;
  }
}
