import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  //Register
  async register(registerDto: RegisterDto) {
    const { email, password, nom, prenom } = registerDto;

    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Créer l'utilisateur
    try {
      const user = await this.prisma.utilisateur.create({
        data: {
          email,
          mot_de_passe_hash: passwordHash,
          nom,
          prenom,
          role: 'user',
          actif: true,
        },
        select: {
          id: true,
          email: true,
          nom: true,
          prenom: true,
          role: true,
          actif: true,
          date_creation: true,
        },
      });

      return {
        success: true,
        message: 'Utilisateur créé avec succès',
        user,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(
          `Erreur lors de la création de l'utilisateur: ${error.message}`,
        );
      }
      throw new InternalServerErrorException(
        "Erreur lors de la création de l'utilisateur",
      );
    }
  }

  //Validation
  async validateUser(email: string, password: string) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.actif) {
      throw new UnauthorizedException('Compte désactivé');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      user.mot_de_passe_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const { mot_de_passe_hash, ...result } = user;
    return result;
  }

  //Token Generation

  async generateTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Sauvegarder le refresh token
    const refreshTokenDays = parseInt(
      this.configService.get('REFRESH_TOKEN_DAYS', '7'),
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshTokenDays);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        utilisateur_id: user.id,
        expires_at: expiresAt,
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.configService.get('JWT_EXPIRES_IN', '15m'),
      token_type: 'Bearer',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
    };
  }

  //Login

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);
    return this.generateTokens(user);
  }

  //Refresh Token

  async refreshTokens(refreshToken: string) {
    const tokenData = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { utilisateur: true },
    });

    if (!tokenData) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }

    if (tokenData.revoked) {
      throw new UnauthorizedException('Token de rafraîchissement révoqué');
    }

    if (tokenData.expires_at < new Date()) {
      throw new UnauthorizedException('Token de rafraîchissement expiré');
    }

    // Révoquer l'ancien token
    await this.prisma.refreshToken.update({
      where: { id: tokenData.id },
      data: { revoked: true },
    });

    const user = tokenData.utilisateur;
    const { mot_de_passe_hash, ...userWithoutPassword } = user;

    return this.generateTokens(userWithoutPassword);
  }

  //Logout

  async logout(refreshToken: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        token: refreshToken,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException('Token de rafraîchissement non trouvé');
    }

    return {
      success: true,
      message: 'Déconnexion réussie',
    };
  }

  //Revoke all Tokens

  async revokeAllUserTokens(userId: number) {
    await this.prisma.refreshToken.updateMany({
      where: {
        utilisateur_id: userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    return {
      success: true,
      message: 'Tous les tokens ont été révoqués',
    };
  }
}
