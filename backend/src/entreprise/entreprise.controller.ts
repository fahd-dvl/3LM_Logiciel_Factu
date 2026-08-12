import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { EntrepriseService } from './entreprise.service';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto';
import { UpdateEntrepriseDto } from './dto/update-entreprise.dto';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { CurrentEntreprise } from 'src/auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from 'src/auth/guards/entreprise-active.guard';

@Controller('entreprises')
@UseGuards(AuthGuard('jwt'))
export class EntrepriseController {
  constructor(private readonly entrepriseService: EntrepriseService) {}

  @Post()
  create(@Body() dto: CreateEntrepriseDto, @CurrentUser() user: any) {
    return this.entrepriseService.creer(user.id, dto);
  }

  @Get('mes-entreprises')
  findAllMine(@CurrentUser() user: any) {
    return this.entrepriseService.findAllByUtilisateur(user.id);
  }

  @Get(':id')
  @UseGuards(EntrepriseActiveGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    if (entrepriseId !== id) {
      throw new ForbiddenException(
        "Vous ne pouvez accéder qu'à votre entreprise active",
      );
    }
    return this.entrepriseService.findOne(user.id, id);
  }

  @Put(':id')
  @UseGuards(EntrepriseActiveGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEntrepriseDto,
    @CurrentUser() user: any,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    if (entrepriseId !== id) {
      throw new ForbiddenException(
        'Vous ne pouvez modifier que votre entreprise active',
      );
    }

    return this.entrepriseService.update(user.id, id, dto);
  }
}
