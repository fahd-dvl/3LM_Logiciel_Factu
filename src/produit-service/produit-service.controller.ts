import {
  Controller,
  Get,
  Body,
  Post,
  Delete,
  Param,
  Put,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProduitServiceService } from './produit-service.service';
import { CreateProduitServiceDto } from './dto/create-produit-service.dto';
import { UpdateProduitServiceDto } from './dto/update-produit-service.dto';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('produit-service')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class ProduitServiceController {
  constructor(private readonly produitServiceService: ProduitServiceService) {}

  @Get()
  async findAll(@CurrentEntreprise() entrepriseId: number) {
    return this.produitServiceService.findAll(entrepriseId);
  }

  @Get('produits')
  async findAllProduits(@CurrentEntreprise() entrepriseId: number) {
    return this.produitServiceService.findAllProduits(entrepriseId);
  }

  @Get('services')
  async findAllServices(@CurrentEntreprise() entrepriseId: number) {
    return this.produitServiceService.findAllServices(entrepriseId);
  }

  @Get('search')
  search(
    @Query('q') searchTerm: string,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.produitServiceService.searchProduitsServices(
      searchTerm,
      entrepriseId,
    );
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.produitServiceService.findById(id, entrepriseId);
  }

  @Post()
  async createProduitService(
    @Body() dto: CreateProduitServiceDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.produitServiceService.createProduitService(dto, entrepriseId);
  }

  @Put(':id')
  async updateProduitService(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProduitServiceDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.produitServiceService.updateProduitService(
      id,
      dto,
      entrepriseId,
    );
  }

  @Delete(':id')
  async deleteProduitService(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.produitServiceService.deleteProduitService(id, entrepriseId);
  }
}
