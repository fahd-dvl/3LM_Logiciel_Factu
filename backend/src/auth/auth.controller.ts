import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChoisirEntrepriseDto } from './dto/choisir-entreprise.dto';
import { Public } from './decorators/public.decorator';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  register(
    @Body() registerDto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(registerDto, req, res);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(loginDto, req, res);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(200)
  refresh(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refreshTokens(
      user.id,
      user.entreprise_id, // ← propagé depuis JwtRefreshStrategy
      user.refreshToken,
      req,
      res,
    );
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  me(@CurrentUser() user: any) {
    return { user };
  }

  /**
   * Change l'entreprise active pour la session en cours : vérifie
   * l'appartenance puis réémet un nouveau couple access/refresh token
   * avec entreprise_id à jour dans le payload.
   */
  @Post('choisir-entreprise')
  @HttpCode(200)
  choisirEntreprise(
    @CurrentUser() user: any,
    @Body() dto: ChoisirEntrepriseDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.choisirEntreprise(
      user.id,
      dto.entreprise_id,
      req,
      res,
    );
  }

  @Post('logout')
  @HttpCode(200)
  logout(
    @CurrentUser() user: any,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(user.id, req.cookies?.refresh_token, res);
  }
}
