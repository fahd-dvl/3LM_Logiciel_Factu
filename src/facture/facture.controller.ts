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
} from '@nestjs/common';
import { FactureService } from './facture.service';
import { CreateFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';
import { ChangeStatutFactureDto } from './dto/change-statut-facture.dto';
import { ConvertirDevisDto } from './dto/convertir-devis.dto';
import { StatutFacture } from 'generated/prisma/browser';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('factures')
export class FactureController {
  constructor(private readonly factureService: FactureService) {}

  @Post()
  create(@Body() dto: CreateFactureDto, @CurrentUser() user: any) {
    return this.factureService.creer(user.id, dto);
  }

  @Post('depuis-devis/:devisId')
  creerDepuisDevis(
    @CurrentUser() user: any,
    @Param('devisId', ParseIntPipe) devisId: number,
    @Body() dto: ConvertirDevisDto,
  ) {
    return this.factureService.creerDepuisDevis(
      user.id,
      devisId,
      dto.delai_paiement_jours,
    );
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('statut') statut?: StatutFacture) {
    return this.factureService.findAll(user.id, statut);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.factureService.findOne(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFactureDto,
  ) {
    return this.factureService.update(user.id, id, dto);
  }

  @Patch(':id/statut')
  changerStatut(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatutFactureDto,
  ) {
    return this.factureService.changerStatut(user.id, id, dto.statut);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.factureService.remove(user.id, id);
  }
}
