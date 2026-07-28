import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Injectable()
export class ClientService {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // READ - Tous les clients de l'entreprise
  // ============================================

  async findAll(entrepriseId: number) {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          entreprise_id: entrepriseId, // ✅ Filtré par entreprise
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

  // ============================================
  // READ - Un client spécifique
  // ============================================

  async findOne(id: number, entrepriseId: number) {
    try {
      const client = await this.prisma.client.findFirst({
        where: {
          id: id,
          entreprise_id: entrepriseId, // ✅ Filtré par entreprise
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

  // ============================================
  // READ - Clients par type (particulier/entreprise)
  // ============================================

  async findByType(type: string, entrepriseId: number) {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          entreprise_id: entrepriseId, // ✅ Filtré par entreprise
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

  // ============================================
  // READ - Recherche de clients
  // ============================================

  async searchClients(searchTerm: string, entrepriseId: number) {
    try {
      const clients = await this.prisma.client.findMany({
        where: {
          entreprise_id: entrepriseId, // ✅ Filtré par entreprise
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

  // ============================================
  // CREATE - Créer un nouveau client
  // ============================================

  async createClient(
    createClientDto: CreateClientDto,
    entrepriseId: number,
    utilisateurId: number,
  ) {
    try {
      // Vérifier que le pays existe
      const pays = await this.prisma.pays.findUnique({
        where: { id: createClientDto.pays_id },
      });

      if (!pays) {
        throw new NotFoundException('Pays non trouvé');
      }

      // Vérifier l'unicité du SIRET dans l'entreprise
      if (createClientDto.siret) {
        const existingClient = await this.prisma.client.findFirst({
          where: {
            siret: createClientDto.siret,
            entreprise_id: entrepriseId, // ✅ SIRET unique par entreprise
          },
        });

        if (existingClient) {
          throw new BadRequestException(
            'Un client avec ce SIRET existe déjà dans cette entreprise',
          );
        }
      }

      const data = {
        ...createClientDto,
        utilisateur_id: utilisateurId,
        entreprise_id: entrepriseId, // ✅ Liaison automatique à l'entreprise
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

  // ============================================
  // UPDATE - Mettre à jour un client
  // ============================================

  async updateClient(
    id: number,
    updateClientDto: UpdateClientDto,
    entrepriseId: number,
  ) {
    try {
      // Vérifier si le client existe et appartient à l'entreprise
      const existingClient = await this.prisma.client.findFirst({
        where: {
          id: id,
          entreprise_id: entrepriseId, // ✅ Filtré par entreprise
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
        const clientWithSiret = await this.prisma.client.findFirst({
          where: {
            siret: updateClientDto.siret,
            entreprise_id: entrepriseId, // ✅ SIRET unique par entreprise
          },
        });

        if (clientWithSiret) {
          throw new BadRequestException(
            'Un client avec ce SIRET existe déjà dans cette entreprise',
          );
        }
      }

      const data: any = { ...updateClientDto };
      delete data.utilisateur_id;
      delete data.id;
      delete data.entreprise_id; // ✅ Empêcher le changement d'entreprise

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

  // ============================================
  // DELETE - Supprimer un client
  // ============================================

  async deleteClient(id: number, entrepriseId: number) {
    try {
      // Vérifier si le client existe et appartient à l'entreprise
      const client = await this.prisma.client.findFirst({
        where: {
          id: id,
          entreprise_id: entrepriseId, // ✅ Filtré par entreprise
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

  // ============================================
  // UTILITAIRE - Vérifier l'appartenance
  // ============================================

  async verifyClientOwnership(
    clientId: number,
    entrepriseId: number,
  ): Promise<boolean> {
    const client = await this.prisma.client.findFirst({
      where: {
        id: clientId,
        entreprise_id: entrepriseId,
      },
      select: { id: true },
    });

    return !!client;
  }
}
