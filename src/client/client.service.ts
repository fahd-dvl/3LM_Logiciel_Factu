import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  //Read

  async findAll(userId: number) {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          utilisateur_id: userId,
        },
        include: {
          pays: true,
          utilisateur: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
        },
        orderBy: {
          nom: 'asc',
        },
      });

      return clients;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des clients: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async findOne(id: number, userId: number) {
    try {
      const client = await this.prisma.client.findFirst({
        where: {
          id: id,
          utilisateur_id: userId,
        },
        include: {
          pays: true,
          utilisateur: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
          devis: {
            select: {
              id: true,
              numero: true,
              total_ttc: true,
              statut: true,
              date_creation: true,
            },
            orderBy: {
              date_creation: 'desc',
            },
            take: 5,
          },
          facture: {
            select: {
              id: true,
              numero: true,
              total_ttc: true,
              statut: true,
              date_emission: true,
            },
            orderBy: {
              date_emission: 'desc',
            },
            take: 5,
          },
        },
      });

      if (!client) {
        throw new NotFoundException('Client non trouvé ou non autorisé');
      }

      return client;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la récupération du client: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async findByType(type: string, userId: number) {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          utilisateur_id: userId,
          type: type as any,
        },
        include: {
          pays: true,
        },
        orderBy: {
          nom: 'asc',
        },
      });

      return clients;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erreur lors de la récupération des clients par type: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  async searchClients(searchTerm: string, userId: number) {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          utilisateur_id: userId,
          OR: [
            { nom: { contains: searchTerm, mode: 'insensitive' } },
            { prenom: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
            { telephone: { contains: searchTerm, mode: 'insensitive' } },
            { siret: { contains: searchTerm, mode: 'insensitive' } },
            { ville: { contains: searchTerm, mode: 'insensitive' } },
          ],
        },
        include: {
          pays: true,
        },
        orderBy: {
          nom: 'asc',
        },
      });

      return clients;
    } catch (error) {
      throw new InternalServerErrorException(
        'Erreur lors de la recherche des clients: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  //Create

  async createClient(createClientDto: CreateClientDto, userId: number) {
    try {
      const pays = await this.prisma.pays.findUnique({
        where: { id: createClientDto.pays_id },
      });

      if (!pays) {
        throw new NotFoundException('Pays non trouvé');
      }

      if (createClientDto.siret) {
        const existingClient = await this.prisma.client.findUnique({
          where: { siret: createClientDto.siret },
        });

        if (existingClient) {
          throw new BadRequestException('Un client avec ce SIRET existe déjà');
        }
      }

      const data = {
        ...createClientDto,
        utilisateur_id: userId,
      };

      const client = await this.prisma.client.create({
        data,
        include: {
          utilisateur: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
          pays: true,
        },
      });

      return client;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la création du client: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  //Update

  async updateClient(
    id: number,
    updateClientDto: UpdateClientDto,
    userId: number,
  ) {
    try {
      // Vérifier si le client existe et appartient à l'utilisateur
      const existingClient = await this.prisma.client.findFirst({
        where: {
          id: id,
          utilisateur_id: userId,
        },
      });

      if (!existingClient) {
        throw new NotFoundException('Client non trouvé ou non autorisé');
      }

      // Vérifier si le pays existe (si fourni)
      if (updateClientDto.pays_id) {
        const pays = await this.prisma.pays.findUnique({
          where: { id: updateClientDto.pays_id },
        });

        if (!pays) {
          throw new NotFoundException('Pays non trouvé');
        }
      }

      // Vérifier si le SIRET est unique (si fourni et différent)
      if (
        updateClientDto.siret &&
        updateClientDto.siret !== existingClient.siret
      ) {
        const clientWithSiret = await this.prisma.client.findUnique({
          where: { siret: updateClientDto.siret },
        });

        if (clientWithSiret) {
          throw new BadRequestException('Un client avec ce SIRET existe déjà');
        }
      }

      const data: any = { ...updateClientDto };
      delete data.utilisateur_id;
      delete data.id;

      const updatedClient = await this.prisma.client.update({
        where: { id: id },
        data: data,
        include: {
          utilisateur: {
            select: {
              id: true,
              nom: true,
              email: true,
            },
          },
          pays: true,
        },
      });

      return updatedClient;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Erreur lors de la mise à jour du client: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }

  //Delete
  async deleteClient(id: number, userId: number) {
    try {
      // Vérifier si le client existe et appartient à l'utilisateur
      const client = await this.prisma.client.findFirst({
        where: {
          id: id,
          utilisateur_id: userId,
        },
        include: {
          devis: {
            take: 1,
          },
          facture: {
            take: 1,
          },
        },
      });

      if (!client) {
        throw new NotFoundException('Client non trouvé ou non autorisé');
      }

      // Vérifier si le client a des devis ou factures
      if (client.devis.length > 0 || client.facture.length > 0) {
        throw new BadRequestException(
          'Impossible de supprimer ce client car il a des devis ou factures associés',
        );
      }

      // Supprimer le client
      await this.prisma.client.delete({
        where: { id: id },
      });

      return {
        message: 'Client supprimé avec succès',
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
        'Erreur lors de la suppression du client: ' +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
}
