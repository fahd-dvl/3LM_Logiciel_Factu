import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';

@Injectable()
export class FournisseurService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFournisseurDto, entrepriseId: number) {
    try {
      return await this.prisma.fournisseur.create({
        data: {
          entreprise_id: entrepriseId,
          nom: dto.nom,
          email: dto.email,
          telephone: dto.telephone,
          adresse: dto.adresse,
          matricule_fiscal: dto.matricule_fiscal,
          siret: dto.siret,
          pays_id: dto.pays_id,
          note: dto.note,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un fournisseur avec ce SIRET existe déjà pour cette entreprise',
        );
      }
      throw error;
    }
  }

  async findOne(id: number, entrepriseId: number) {
    const fournisseur = await this.prisma.fournisseur.findFirst({
      where: { id, entreprise_id: entrepriseId },
    });

    if (!fournisseur) {
      throw new NotFoundException('Fournisseur introuvable');
    }

    return fournisseur;
  }

  async findAll(entrepriseId: number) {
    return this.prisma.fournisseur.findMany({
      where: { entreprise_id: entrepriseId },
      orderBy: { nom: 'asc' },
    });
  }

  async searchFournisseurs(searchTerm: string, entrepriseId: number) {
    return this.prisma.fournisseur.findMany({
      where: {
        entreprise_id: entrepriseId,
        OR: [
          { nom: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { telephone: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { nom: 'asc' },
    });
  }

  async update(id: number, dto: UpdateFournisseurDto, entrepriseId: number) {
    await this.findOne(id, entrepriseId);

    try {
      return await this.prisma.fournisseur.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un fournisseur avec ce SIRET existe déjà pour cette entreprise',
        );
      }
      throw error;
    }
  }

  async remove(id: number, entrepriseId: number) {
    await this.findOne(id, entrepriseId);

    const nbDepenses = await this.prisma.depense.count({
      where: { fournisseur_id: id },
    });

    if (nbDepenses > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce fournisseur : ${nbDepenses} dépense(s) y sont rattachées`,
      );
    }

    return this.prisma.fournisseur.delete({ where: { id } });
  }
}
