import {
  Controller,
  Get,
  Post,
  Put,
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
import { FournisseurService } from './fournisseur.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('fournisseurs')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard)
export class FournisseurController {
  constructor(private readonly fournisseurService: FournisseurService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() dto: CreateFournisseurDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.fournisseurService.create(dto, entrepriseId);
  }

  @Get()
  findAll(@CurrentEntreprise() entrepriseId: number) {
    return this.fournisseurService.findAll(entrepriseId);
  }

  @Get('search')
  search(
    @Query('q') searchTerm: string,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    if (!searchTerm) {
      return this.fournisseurService.findAll(entrepriseId);
    }
    return this.fournisseurService.searchFournisseurs(searchTerm, entrepriseId);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.fournisseurService.findOne(id, entrepriseId);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFournisseurDto,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.fournisseurService.update(id, dto, entrepriseId);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.fournisseurService.remove(id, entrepriseId);
  }
}
