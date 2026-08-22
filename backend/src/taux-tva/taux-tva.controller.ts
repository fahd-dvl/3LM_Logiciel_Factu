// src/taux-tva/taux-tva.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TauxTvaService } from './taux-tva.service';
import { CreateTauxTvaDto } from './dto/create-taux-tva.dto';
import { UpdateTauxTvaDto } from './dto/update-taux-tva.dto';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('taux-tva')
@UseGuards(AuthGuard('jwt'))
export class TauxTvaController {
  constructor(private readonly tauxTvaService: TauxTvaService) {}

  // ============================================
  // GET - Récupérer tous les taux de TVA
  // ============================================

  @Get()
  async findAll() {
    return this.tauxTvaService.findAll();
  }

  // ============================================
  // GET - Récupérer les taux de TVA d'un pays
  // ============================================

  @Get('pays/:paysId')
  async findByPays(@Param('paysId', ParseIntPipe) paysId: number) {
    return this.tauxTvaService.findByPays(paysId);
  }

  // ============================================
  // GET - Récupérer les taux de TVA de l'entreprise
  // ============================================

  @Get('entreprise')
  @UseGuards(EntrepriseActiveGuard)
  async findByEntreprise(@CurrentEntreprise() entrepriseId: number) {
    return this.tauxTvaService.findByEntreprise(entrepriseId);
  }

  // ============================================
  // GET - Récupérer un taux de TVA par ID
  // ============================================

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tauxTvaService.findOne(id);
  }

  // ============================================
  // GET - Récupérer le taux par défaut d'un pays
  // ============================================

  @Get('pays/:paysId/default')
  async findDefaultByPays(@Param('paysId', ParseIntPipe) paysId: number) {
    return this.tauxTvaService.findDefaultByPays(paysId);
  }

  // ============================================
  // POST - Créer un taux de TVA
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTauxTvaDto) {
    return this.tauxTvaService.create(dto);
  }

  // ============================================
  // PUT - Mettre à jour un taux de TVA
  // ============================================

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTauxTvaDto,
  ) {
    return this.tauxTvaService.update(id, dto);
  }

  // ============================================
  // DELETE - Supprimer un taux de TVA
  // ============================================

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.tauxTvaService.delete(id);
  }
}
