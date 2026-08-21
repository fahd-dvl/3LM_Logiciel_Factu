import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';

@Injectable()
export class UtilisateurService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        telephone: true,
        role: true,
        actif: true,
        date_creation: true,
        derniere_connexion: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  async update(id: number, dto: UpdateUtilisateurDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const updatedUser = await this.prisma.utilisateur.update({
      where: { id },
      data: {
        prenom: dto.prenom,
        nom: dto.nom,
        telephone: dto.telephone,
      },
      select: {
        id: true,
        email: true,
        prenom: true,
        nom: true,
        telephone: true,
        role: true,
        actif: true,
      },
    });

    return updatedUser;
  }
}
