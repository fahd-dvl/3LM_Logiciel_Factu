import { Controller, Put, Body, UseGuards, Get } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UtilisateurService } from './utilisateur.service';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('utilisateurs')
@UseGuards(AuthGuard('jwt'))
export class UtilisateurController {
  constructor(private readonly utilisateurService: UtilisateurService) {}

  @Get('me')
  async getMe(@CurrentUser() user: any) {
    return this.utilisateurService.findOne(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() dto: UpdateUtilisateurDto,
  ) {
    return this.utilisateurService.update(user.id, dto);
  }
}
