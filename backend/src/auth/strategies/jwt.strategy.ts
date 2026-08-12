import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: (req: Request) => {
        return req?.cookies?.access_token ?? null;
      },
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: payload.sub },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException('Utilisateur invalide ou inactif');
    }

    let entrepriseId: number | null = null;

    if (payload.entreprise_id) {
      const entreprise = await this.prisma.entreprise.findFirst({
        where: { id: payload.entreprise_id, utilisateur_id: user.id },
      });

      // Si l'entreprise n'existe plus ou n'appartient plus à cet utilisateur,
      // on ignore silencieusement plutôt que de rejeter toute la requête :
      // EntrepriseActiveGuard se chargera de bloquer les endpoints qui en ont besoin.
      entrepriseId = entreprise ? entreprise.id : null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      entreprise_id: entrepriseId,
    };
  }
}
