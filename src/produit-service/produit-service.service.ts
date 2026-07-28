import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TypeProduitService } from '\generated/prisma/enums';
import { CreateProduitServiceDto } from './dto/create-produit-service.dto';
import { UpdateProduitServiceDto } from './dto/update-produit-service.dto';

@Injectable()
export class ProduitServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(entrepriseId: number) {
    return this.prisma.produitService.findMany({
      where: { entreprise_id: entrepriseId },
      include: { categorie: true, taux_tva: true },
    });
  }

  async findAllProduits(entrepriseId: number) {
    return this.prisma.produitService.findMany({
      where: { type: TypeProduitService.PRODUIT, entreprise_id: entrepriseId },
      include: { categorie: true, taux_tva: true },
    });
  }

  async findAllServices(entrepriseId: number) {
    return this.prisma.produitService.findMany({
      where: { type: TypeProduitService.SERVICE, entreprise_id: entrepriseId },
      include: { categorie: true, taux_tva: true },
    });
  }

  async findById(id: number, entrepriseId: number) {
    const produit = await this.prisma.produitService.findFirst({
      where: { id, entreprise_id: entrepriseId },
      include: { taux_tva: true, categorie: true },
    });

    if (!produit) {
      throw new NotFoundException('Produit/service introuvable');
    }

    return produit;
  }

  async searchProduitsServices(searchTerm: string, entrepriseId: number) {
    return this.prisma.produitService.findMany({
      where: {
        entreprise_id: entrepriseId,
        OR: [
          { nom: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { unite: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      include: { categorie: true, taux_tva: true },
      orderBy: { nom: 'asc' },
    });
  }

  async createProduitService(
    dto: CreateProduitServiceDto,
    entrepriseId: number,
  ) {
    const tauxTva = await this.prisma.tauxTva.findUnique({
      where: { id: dto.taux_tva_id },
    });

    if (!tauxTva) {
      throw new NotFoundException('Taux de TVA non trouvé');
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

    return this.prisma.produitService.create({
      data: {
        entreprise_id: entrepriseId,
        nom: dto.nom,
        description: dto.description,
        prix_unitaire_ht: dto.prix_unitaire_ht,
        unite: dto.unite ?? 'pièce',
        taux_tva_id: dto.taux_tva_id,
        categorie_id: dto.categorie_id,
        actif: dto.actif ?? true,
        type: dto.type,
      },
      include: { taux_tva: true, categorie: true },
    });
  }

  async updateProduitService(
    id: number,
    dto: UpdateProduitServiceDto,
    entrepriseId: number,
  ) {
    await this.findById(id, entrepriseId); // vérifie existence + appartenance

    if (dto.taux_tva_id) {
      const tauxTva = await this.prisma.tauxTva.findUnique({
        where: { id: dto.taux_tva_id },
      });
      if (!tauxTva) {
        throw new NotFoundException('Taux de TVA non trouvé');
      }
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

    return this.prisma.produitService.update({
      where: { id },
      data: dto,
      include: { taux_tva: true, categorie: true },
    });
  }

  async deleteProduitService(id: number, entrepriseId: number) {
    await this.findById(id, entrepriseId);

    const [devisLignes, factureLignes] = await Promise.all([
      this.prisma.devisLigne.findFirst({ where: { produit_id: id } }),
      this.prisma.factureLigne.findFirst({ where: { produit_id: id } }),
    ]);

    if (devisLignes || factureLignes) {
      throw new BadRequestException(
        'Impossible de supprimer ce produit/service car il est utilisé dans des devis ou factures',
      );
    }

    await this.prisma.produitService.delete({ where: { id } });

    return { message: 'Produit/Service supprimé avec succès', id };
  }
}
