import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateProduitServiceDto } from './dto/create-produit-service.dto';
import { TypeProduitService } from 'generated/prisma/browser';
import { UpdateProduitServiceDto } from './dto/update-produit-service.dto';

@Injectable()
export class ProduitServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.produitService.findMany({
      where: { utilisateur_id: userId },
    });
  }

  async findAllProduits(userId: number) {
    return this.prisma.produitService.findMany({
      where: { type: TypeProduitService.PRODUIT, utilisateur_id: userId },
      include: { categorie: true, taux_tva: true },
    });
  }

  async findAllServices(userId: number) {
    return this.prisma.produitService.findMany({
      where: { type: TypeProduitService.SERVICE, utilisateur_id: userId },
      include: { categorie: true, taux_tva: true },
    });
  }

  async findById(id: number, userId: number) {
    return this.prisma.produitService.findMany({
      where: { id: id, utilisateur_id: userId },
      include: { taux_tva: true, categorie: true },
    });
  }

  async searchProduitsServices(searchTerm: string, userId: number) {
    try {
      const produits = await this.prisma.produitService.findMany({
        where: {
          utilisateur_id: userId,
          OR: [
            { nom: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { unite: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          categorie: true,
          taux_tva: true,
        },
        orderBy: {
          nom: 'asc',
        },
      });

      return produits;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erreur lors de la recherche des produits/services: ' +
          (error instanceof Error ? error.message : 'Erreur inconnue'),
      );
    }
  }

  async createProduitService(
    createProduitServiceDto: CreateProduitServiceDto,
    userId: number,
  ) {
    try {
      const tauxTva = await this.prisma.tauxTva.findUnique({
        where: { id: createProduitServiceDto.taux_tva_id },
      });

      if (!tauxTva) {
        throw new NotFoundException('Taux de TVA non trouvé');
      }

      if (createProduitServiceDto.categorie_id) {
        const categorie = await this.prisma.categorie.findUnique({
          where: { id: createProduitServiceDto.categorie_id },
        });

        if (!categorie) {
          throw new NotFoundException('Catégorie non trouvée');
        }
      }

      const data = {
        ...createProduitServiceDto,
        utilisateur_id: userId,
        unite: createProduitServiceDto.unite || 'pièce',
        actif:
          createProduitServiceDto.actif !== undefined
            ? createProduitServiceDto.actif
            : true,
      };

      const produitService = await this.prisma.produitService.create({
        data,
        include: {
          taux_tva: true,
          categorie: true,
          utilisateur: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
      });

      return produitService;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la création du produit/service: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async updateProduitService(
    id: number,
    updateProduitServiceDto: UpdateProduitServiceDto,
    userId: number,
  ) {
    try {
      const produitService = await this.prisma.produitService.findFirst({
        where: {
          id: id,
          utilisateur_id: userId,
        },
      });
      if (!produitService) {
        throw new NotFoundException(
          'Produit/Service non trouvé ou vous non autorisé à le modifier',
        );
      }

      if (updateProduitServiceDto.taux_tva_id) {
        const tauxTva = await this.prisma.tauxTva.findUnique({
          where: { id: updateProduitServiceDto.taux_tva_id },
        });

        if (!tauxTva) {
          throw new NotFoundException('Taux de TVA non trouvé');
        }
      }

      if (updateProduitServiceDto.categorie_id) {
        const categorie = await this.prisma.categorie.findUnique({
          where: { id: updateProduitServiceDto.categorie_id },
        });
        if (!categorie) {
          throw new NotFoundException('Catégorie non trouvée');
        }
      }

      const data: any = { ...updateProduitServiceDto };

      delete data.utilisateur_id;
      delete data.id;

      const updatedProduitService = await this.prisma.produitService.update({
        where: { id: id },
        data: data,
        include: {
          taux_tva: true,
          categorie: true,
          utilisateur: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
      });
      return updatedProduitService;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour du produit/service: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async deleteProduitService(id: number, userId: number) {
    try {
      const produitService = await this.prisma.produitService.findFirst({
        where: {
          id: id,
          utilisateur_id: userId,
        },
      });

      if (!produitService) {
        throw new NotFoundException(
          'Produit/Service non trouvé ou non autorisé à le supprimer',
        );
      }

      const devisLignes = await this.prisma.devisLigne.findFirst({
        where: { produit_id: id },
      });

      const factureLignes = await this.prisma.factureLigne.findFirst({
        where: { produit_id: id },
      });

      if (devisLignes || factureLignes) {
        throw new BadRequestException(
          'Impossible de supprimer ce produit/service car il est utilisé dans des devis ou factures',
        );
      }

      await this.prisma.produitService.delete({
        where: { id: id },
      });

      return {
        message: 'Produit/Service supprimé avec succés',
        id: id,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la suppression du produit/service: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
