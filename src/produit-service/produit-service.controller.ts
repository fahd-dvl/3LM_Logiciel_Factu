import {
  Controller,
  Get,
  Body,
  Post,
  Delete,
  Param,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { ProduitServiceService } from './produit-service.service';
import { CreateProduitServiceDto } from './dto/create-produit-service.dto';
import HttpCode from 'http-status-codes';
import { UpdateProduitServiceDto } from './dto/update-produit-service.dto';

@Controller('produit-service')
export class ProduitServiceController {
  constructor(private readonly produitServiceService: ProduitServiceService) {}

  @Get('produits')
  async findAllProduits() {
    return this.produitServiceService.findAllProduits();
  }

  @Get('services')
  async findAllServices() {
    return this.produitServiceService.findAllServices();
  }

  @Get('produits/:id')
  async findProduitById(id: number) {
    return this.produitServiceService.findProduitById(id);
  }

  @Get('services/:id')
  async findServiceById(id: number) {
    return this.produitServiceService.findServiceById(id);
  }

  @Post()
  async createProduitService(
    @Body() createProduitServiceDto: CreateProduitServiceDto,
  ) {
    const userId = 1;
    return this.produitServiceService.createProduitService(
      createProduitServiceDto,
      userId,
    );
  }

  @Put(':id')
  async updateProduitService(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProduitServiceDto: UpdateProduitServiceDto,
  ) {
    const userId = 1;
    return this.produitServiceService.updateProduitService(
      id,
      updateProduitServiceDto,
      userId,
    );
  }

  @Delete(':id')
  async deleteProduitService(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProduitService: UpdateProduitServiceDto,
  ) {
    const userId = 1;
    return this.produitServiceService.deleteProduitService(
      id,

      userId,
    );
  }
}
