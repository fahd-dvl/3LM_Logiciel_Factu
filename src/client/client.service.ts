import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, TypeClient } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  async createClient(
    dto: CreateClientDto,
    entrepriseId: number,
    _utilisateurId: number,
  ) {
    try {
      return await this.prisma.client.create({
        data: {
          entreprise_id: entrepriseId,
          type: dto.type,
          nom: dto.nom,
          prenom: dto.prenom,
          email: dto.email,
          telephone: dto.telephone,
          adresse: dto.adresse,
          code_postal: dto.code_postal,
          ville: dto.ville,
          pays_id: dto.pays_id,
          siret: dto.siret,
          matricule_fiscal: dto.matricule_fiscal,
          adresse_legale: dto.adresse_legale,
          raison_sociale: dto.raison_sociale,
          note: dto.note,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un client avec ce SIRET existe déjà pour cette entreprise',
        );
      }
      throw error;
    }
  }

  async findOne(id: number, entrepriseId: number) {
    const client = await this.prisma.client.findFirst({
      where: { id, entreprise_id: entrepriseId },
    });

    if (!client) {
      throw new NotFoundException('Client introuvable');
    }

    return client;
  }

  async findAll(entrepriseId: number) {
    return this.prisma.client.findMany({
      where: { entreprise_id: entrepriseId },
      orderBy: { nom: 'asc' },
    });
  }

  async findByType(type: string, entrepriseId: number) {
    if (!Object.values(TypeClient).includes(type as TypeClient)) {
      throw new BadRequestException(
        `Type de client invalide. Valeurs autorisées : ${Object.values(TypeClient).join(', ')}`,
      );
    }

    return this.prisma.client.findMany({
      where: { entreprise_id: entrepriseId, type: type as TypeClient },
      orderBy: { nom: 'asc' },
    });
  }

  async searchClients(searchTerm: string, entrepriseId: number) {
    return this.prisma.client.findMany({
      where: {
        entreprise_id: entrepriseId,
        OR: [
          { nom: { contains: searchTerm, mode: 'insensitive' } },
          { prenom: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
          { raison_sociale: { contains: searchTerm, mode: 'insensitive' } },
          { telephone: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      orderBy: { nom: 'asc' },
    });
  }

  async updateClient(id: number, dto: UpdateClientDto, entrepriseId: number) {
    await this.findOne(id, entrepriseId); // vérifie existence + appartenance

    try {
      return await this.prisma.client.update({
        where: { id },
        data: {
          ...(dto.type && { type: dto.type }),
          ...(dto.nom && { nom: dto.nom }),
          ...(dto.prenom !== undefined && { prenom: dto.prenom }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.telephone !== undefined && { telephone: dto.telephone }),
          ...(dto.adresse !== undefined && { adresse: dto.adresse }),
          ...(dto.code_postal !== undefined && {
            code_postal: dto.code_postal,
          }),
          ...(dto.ville !== undefined && { ville: dto.ville }),
          ...(dto.pays_id && { pays_id: dto.pays_id }),
          ...(dto.siret !== undefined && { siret: dto.siret }),
          ...(dto.matricule_fiscal !== undefined && {
            matricule_fiscal: dto.matricule_fiscal,
          }),
          ...(dto.adresse_legale !== undefined && {
            adresse_legale: dto.adresse_legale,
          }),
          ...(dto.raison_sociale !== undefined && {
            raison_sociale: dto.raison_sociale,
          }),
          ...(dto.note !== undefined && { note: dto.note }),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Un client avec ce SIRET existe déjà pour cette entreprise',
        );
      }
      throw error;
    }
  }

  async deleteClient(id: number, entrepriseId: number) {
    await this.findOne(id, entrepriseId);

    const [nbDevis, nbFactures] = await Promise.all([
      this.prisma.devis.count({ where: { client_id: id } }),
      this.prisma.facture.count({ where: { client_id: id } }),
    ]);

    if (nbDevis > 0 || nbFactures > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce client : ${nbDevis} devis et ${nbFactures} facture(s) y sont rattachés`,
      );
    }

    return this.prisma.client.delete({ where: { id } });
  }
}
