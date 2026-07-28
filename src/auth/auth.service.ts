import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import ms, { StringValue } from 'ms';
import { PrismaService } from '../prisma/prisma.service';
import { EntrepriseService } from '../entreprise/entreprise.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private entrepriseService: EntrepriseService, // ← nouveau
  ) {}

  async register(registerDto: RegisterDto, req: Request, res: Response) {
    const { email, password, nom, prenom } = registerDto;

    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await this.prisma.utilisateur.create({
      data: {
        email,
        mot_de_passe_hash: passwordHash,
        nom,
        prenom,
        role: 'user',
        actif: true,
      },
    });

    // Nouvel utilisateur : jamais d'entreprise à l'inscription
    return this.generateTokens(user, req, res, null);
  }

  async login(loginDto: LoginDto, req: Request, res: Response) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    const entreprises = await this.entrepriseService.findAllByUtilisateur(
      user.id,
    );
    // Sélection automatique seulement si une unique entreprise existe
    const entrepriseIdAuto =
      entreprises.length === 1 ? entreprises[0].id : null;

    return this.generateTokens(user, req, res, entrepriseIdAuto);
  }

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

  /**
   * Change l'entreprise active : vérifie que l'entreprise appartient bien
   * à l'utilisateur, puis réémet un nouveau couple de tokens avec
   * entreprise_id mis à jour dans le payload.
   */
  async choisirEntreprise(
    userId: number,
    entrepriseId: number,
    req: Request,
    res: Response,
  ) {
    // findOne lève déjà NotFoundException / ForbiddenException si besoin
    await this.entrepriseService.findOne(userId, entrepriseId);

    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException('Utilisateur invalide ou inactif');
    }

    return this.generateTokens(user, req, res, entrepriseId);
  }

  async refreshTokens(
    userId: number,
    entrepriseId: number | null, // ← nouveau paramètre
    oldRefreshToken: string,
    req: Request,
    res: Response,
  ) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id: userId },
    });

    if (!user || !user.actif) {
      throw new UnauthorizedException('Utilisateur invalide ou inactif');
    }

    await this.prisma.refreshToken.update({
      where: { token: oldRefreshToken },
      data: {
        revoked: true,
        revoked_at: new Date(),
        revoked_reason: 'rotated',
      },
    });

    return this.generateTokens(user, req, res, entrepriseId);
  }

  async logout(
    userId: number,
    refreshToken: string | undefined,
    res: Response,
  ) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { token: refreshToken, revoked: false },
        data: {
          revoked: true,
          revoked_at: new Date(),
          revoked_reason: 'logout',
        },
      });
    }

    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    return { success: true, message: 'Déconnexion réussie' };
  }

  private async generateTokens(
    user: any,
    req: Request,
    res: Response,
    entrepriseId: number | null,
  ) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      entreprise_id: entrepriseId,
    };

    const accessExpiresIn = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '15m',
    ) as StringValue;

    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '7d',
    ) as StringValue;

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshExpiresIn,
    });

    const expiresAt = new Date(Date.now() + ms(refreshExpiresIn));

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        utilisateur_id: user.id,
        expires_at: expiresAt,
        user_agent: req.headers['user-agent'],
        ip_address: req.ip,
      },
    });

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: ms(accessExpiresIn),
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: ms(refreshExpiresIn),
      path: '/',
    });

    return {
      success: true,
      message: 'Authentification réussie',
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role,
      },
      entreprise_id: entrepriseId, // ← utile pour que le frontend sache s'il doit rediriger vers "choisir une société"
    };
  }
}
