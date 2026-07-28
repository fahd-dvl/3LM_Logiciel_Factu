import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaiementService } from './paiement.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('paiements')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class PaiementController {
  constructor(private readonly paiementService: PaiementService) {}

  @Post()
  create(
    @CurrentEntreprise() entrepriseId: number,
    @Body() dto: CreatePaiementDto,
  ) {
    return this.paiementService.creer(entrepriseId, dto);
  }

  @Get()
  findAllByFacture(
    @CurrentEntreprise() entrepriseId: number,
    @Query('facture_id', ParseIntPipe) factureId: number,
  ) {
    return this.paiementService.findAllByFacture(entrepriseId, factureId);
  }

  @Get(':id')
  findOne(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paiementService.findOne(entrepriseId, id);
  }

  @Delete(':id')
  remove(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.paiementService.remove(entrepriseId, id);
  }
}
