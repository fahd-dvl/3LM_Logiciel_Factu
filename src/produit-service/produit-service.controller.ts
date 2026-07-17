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
} from '@nestjs/common';
import { ProduitServiceService } from './produit-service.service';
import { CreateProduitServiceDto } from './dto/create-produit-service.dto';
import { UpdateProduitServiceDto } from './dto/update-produit-service.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('produit-service')
export class ProduitServiceController {
  constructor(private readonly produitServiceService: ProduitServiceService) {}

  @Get()
  async findAll(@CurrentUser() user: any) {
    return (this, this.produitServiceService.findAll(user.id));
  }

  @Get('produits')
  async findAllProduits(@CurrentUser() user: any) {
    return this.produitServiceService.findAllProduits(user.id);
  }

  @Get('services')
  async findAllServices(@CurrentUser() user: any) {
    return this.produitServiceService.findAllServices(user.id);
  }

  @Get('search')
  search(@Query('q') searchTerm: string, @CurrentUser() user: any) {
    return this.produitServiceService.searchProduitsServices(
      searchTerm,
      user.id,
    );
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.produitServiceService.findById(id, user.id);
  }

  @Post()
  async createProduitService(
    @Body() createProduitServiceDto: CreateProduitServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.produitServiceService.createProduitService(
      createProduitServiceDto,
      user.id,
    );
  }

  @Put(':id')
  async updateProduitService(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProduitServiceDto: UpdateProduitServiceDto,
    @CurrentUser() user: any,
  ) {
    return this.produitServiceService.updateProduitService(
      id,
      updateProduitServiceDto,
      user.id,
    );
  }

  @Delete(':id')
  async deleteProduitService(
    @Param('id', ParseIntPipe) id: number,

    @CurrentUser() user: any,
  ) {
    return this.produitServiceService.deleteProduitService(
      id,

      user.id,
    );
  }
}
