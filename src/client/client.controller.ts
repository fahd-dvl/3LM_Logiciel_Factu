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
import { CreateClientDto } from './dto/create-client.dto';
import { ClientService } from './client.service';
import { UpdateClientDto } from './dto/update-client.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('client')
@UseGuards(JwtAuthGuard)
export class ClientController {
  constructor(private clientService: ClientService) {}

  //Create
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClient(
    @Body() createClientDto: CreateClientDto,
    @CurrentUser() user: any,
  ) {
    return this.clientService.createClient(createClientDto, user.id);
  }

  //Update
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
    @CurrentUser() user: any,
  ) {
    return this.clientService.updateClient(id, updateClientDto, user.id);
  }

  //Read
  @Get()
  async findAll(@CurrentUser() user: any) {
    return this.clientService.findAll(user.id);
  }

  @Get('search')
  async searchClients(
    @Query('q') searchTerm: string,
    @CurrentUser() user: any,
  ) {
    return this.clientService.searchClients(searchTerm, user.id);
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string, @CurrentUser() user: any) {
    return this.clientService.findByType(type, user.id);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.clientService.findOne(id, user.id);
  }

  //Delete
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteClient(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.clientService.deleteClient(id, user.id);
  }
}
