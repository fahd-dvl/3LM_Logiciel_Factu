import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DevisService } from './devis.service';
import { CreateDevisDto } from './dto/create-devis.dto';
import { UpdateDevisDto } from './dto/update-devis.dto';
import { ChangeStatutDevisDto } from './dto/change-statut-devis.dto';
import { StatutDevis } from 'generated/prisma/enums';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('devis')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Post()
  create(
    @Body() dto: CreateDevisDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.devisService.creer(entrepriseId, dto);
  }

  @Get()
  findAll(
    @CurrentEntreprise() entrepriseId: number,
    @Query('statut') statut?: StatutDevis,
  ) {
    return this.devisService.findAll(entrepriseId, statut);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.devisService.findOne(entrepriseId, id);
  }

  @Put(':id')
  update(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDevisDto,
  ) {
    return this.devisService.update(entrepriseId, id, dto);
  }

  @Patch(':id/statut')
  changerStatut(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatutDevisDto,
  ) {
    return this.devisService.changerStatut(entrepriseId, id, dto.statut);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.devisService.remove(entrepriseId, id);
  }
}
