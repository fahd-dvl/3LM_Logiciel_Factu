import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Body,
  ParseIntPipe,
  Put,
  Param,
  Get,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientService } from './client.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentEntreprise } from '../auth/decorators/current-entreprise.decorator';
import { EntrepriseActiveGuard } from '../auth/guards/entreprise-active.guard';

@Controller('client')
@UseGuards(AuthGuard('jwt'), EntrepriseActiveGuard) // ✅ Auth + Entreprise active obligatoire
export class ClientController {
  constructor(private clientService: ClientService) {}

  // ============================================
  // CREATE - Créer un client
  // ============================================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClient(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: any,
    @CurrentEntreprise() entrepriseId: number, // ✅ Récupère l'entreprise active
  ) {
    return this.clientService.createClient(
      createClientDto,
      entrepriseId, // ✅ Entreprise active
      user.id, // ✅ Utilisateur créateur
    );
  }

  // ============================================
  // UPDATE - Mettre à jour un client
  // ============================================

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentEntreprise() entrepriseId: number, // ✅ Entreprise active
  ) {
    return this.clientService.updateClient(id, updateClientDto, entrepriseId);
  }

  // ============================================
  // READ - Liste tous les clients
  // ============================================

  @Get()
  async findAll(@CurrentEntreprise() entrepriseId: number) {
    return this.clientService.findAll(entrepriseId);
  }

  // ============================================
  // READ - Recherche de clients
  // ============================================

  @Get('search')
  async searchClients(
    @Query('q') searchTerm: string,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    if (!searchTerm) {
      return this.clientService.findAll(entrepriseId);
    }
    return this.clientService.searchClients(searchTerm, entrepriseId);
  }

  // ============================================
  // READ - Clients par type
  // ============================================

  @Get('type/:type')
  async findByType(
    @Param('type') type: string,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.clientService.findByType(type, entrepriseId);
  }

  // ============================================
  // READ - Détail d'un client
  // ============================================

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.clientService.findOne(id, entrepriseId);
  }

  // ============================================
  // DELETE - Supprimer un client
  // ============================================

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteClient(
    @Param('id', ParseIntPipe) id: number,
    @CurrentEntreprise() entrepriseId: number,
  ) {
    return this.clientService.deleteClient(id, entrepriseId);
  }
}
