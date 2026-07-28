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
import { FactureService } from './facture.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';
import { ChangeStatutFactureDto } from './dto/change-statut-facture.dto';
import { ConvertirDevisDto } from './dto/convertir-devis.dto';
import { StatutFacture } from 'generated/prisma/enums';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('factures')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class FactureController {
  constructor(private readonly factureService: FactureService) {}

  @Post()
  create(
    @Body() dto: CreateFactureDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.factureService.creer(entrepriseId, dto);
  }

  @Post('depuis-devis/:devisId')
  creerDepuisDevis(
    @CurrentEntreprise() entrepriseId: number,
    @Param('devisId', ParseIntPipe) devisId: number,
    @Body() dto: ConvertirDevisDto,
  ) {
    return this.factureService.creerDepuisDevis(
      entrepriseId,
      devisId,
      dto.delai_paiement_jours,
    );
  }

  @Get()
  findAll(
    @CurrentEntreprise() entrepriseId: number,
    @Query('statut') statut?: StatutFacture,
  ) {
    return this.factureService.findAll(entrepriseId, statut);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.factureService.findOne(entrepriseId, id);
  }

  @Put(':id')
  update(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFactureDto,
  ) {
    return this.factureService.update(entrepriseId, id, dto);
  }

  @Patch(':id/statut')
  changerStatut(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatutFactureDto,
  ) {
    return this.factureService.changerStatut(entrepriseId, id, dto.statut);
  }

  @Delete(':id')
  remove(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.factureService.remove(entrepriseId, id);
  }
}
