// src/categorie/categorie.controller.ts
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
import { CategorieService } from './categorie.service';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('categories')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class CategorieController {
  constructor(private readonly categorieService: CategorieService) {}

  // ============================================
  // GET - Récupérer toutes les catégories
  // ============================================

  @Get()
  async findAll(@CurrentEntreprise() entrepriseId: number) {
    return this.categorieService.findAll(entrepriseId);
  }

  // ============================================
  // GET - Récupérer les catégories principales
  // ============================================

  @Get('root')
  async findRootCategories(@CurrentEntreprise() entrepriseId: number) {
    return this.categorieService.findRootCategories(entrepriseId);
  }

  // ============================================
  // GET - Récupérer les sous-catégories
  // ============================================

  @Get(':id/children')
  async findChildren(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categorieService.findChildren(entrepriseId, id);
  }

  // ============================================
  // GET - Récupérer une catégorie par ID
  // ============================================

  @Get(':id')
  async findOne(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categorieService.findOne(entrepriseId, id);
  }

  // ============================================
  // POST - Créer une catégorie
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentEntreprise() entrepriseId: number,
    @Body() dto: CreateCategorieDto,
  ) {
    return this.categorieService.create(entrepriseId, dto);
  }

  // ============================================
  // PUT - Mettre à jour une catégorie
  // ============================================

  @Put(':id')
  async update(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategorieDto,
  ) {
    return this.categorieService.update(entrepriseId, id, dto);
  }

  // ============================================
  // DELETE - Supprimer une catégorie
  // ============================================

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async delete(
    @CurrentEntreprise() entrepriseId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categorieService.delete(entrepriseId, id);
  }
}
