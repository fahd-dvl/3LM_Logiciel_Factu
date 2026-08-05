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
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatutDepense } from 'generated/prisma/client';
import { DepenseService } from './depense.service';
import { CreateDepenseDto } from './dto/create-depense.dto';
import { UpdateDepenseDto } from './dto/update-depense.dto';
import { ChangeStatutDepenseDto } from './dto/change-statut-depense.dto';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('depenses')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class DepenseController {
  constructor(private readonly depenseService: DepenseService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateDepenseDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.depenseService.create(dto, entrepriseId);
  }

  @Get()
  findAll(
    @CurrentEntreprise() entrepriseId: number,
    @Query('fournisseur_id') fournisseurId?: string,
    @Query('categorie_id') categorieId?: string,
    @Query('statut') statut?: StatutDepense,
    @Query('date_debut') dateDebut?: string,
    @Query('date_fin') dateFin?: string,
  ) {
    return this.depenseService.findAll(entrepriseId, {
      fournisseur_id: fournisseurId ? Number(fournisseurId) : undefined,
      categorie_id: categorieId ? Number(categorieId) : undefined,
      statut,
      date_debut: dateDebut,
      date_fin: dateFin,
    });
  }

  @Get('statistiques/par-categorie')
  totalParCategorie(
    @CurrentEntreprise() entrepriseId: number,
    @Query('date_debut') dateDebut?: string,
    @Query('date_fin') dateFin?: string,
  ) {
    return this.depenseService.totalParCategorie(
      entrepriseId,
      dateDebut,
      dateFin,
    );
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.depenseService.findOne(id, entrepriseId);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDepenseDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.depenseService.update(id, dto, entrepriseId);
  }

  @Patch(':id/statut')
  changerStatut(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatutDepenseDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.depenseService.changerStatut(id, dto.statut, entrepriseId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.depenseService.remove(id, entrepriseId);
  }
}
