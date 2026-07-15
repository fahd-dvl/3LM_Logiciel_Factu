import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const result = await this.authService.register(registerDto, req);
    return {
      success: true,
      message: 'Inscription réussie',
      data: result,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(loginDto, req);
    return {
      success: true,
      message: 'Connexion réussie',
      data: result,
    };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() refreshDto: RefreshDto, @Req() req: Request) {
    const result = await this.authService.refreshTokens(refreshDto, req);
    return {
      success: true,
      message: 'Token rafraîchi avec succès',
      data: result,
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() body: { refreshToken: string }) {
    const result = await this.authService.logout(body.refreshToken);
    return {
      success: true,
      message: 'Déconnexion réussie',
      data: result,
    };
  }
}
