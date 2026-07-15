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
} from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { ClientService } from './client.service';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('client')
export class ClientController {
  constructor(private clientService: ClientService) {}

  //Create

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createClient(@Body() createClientDto: CreateClientDto) {
    const userId = 1;
    return this.clientService.createClient(createClientDto, userId);
  }

  //Update
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateClient(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClientDto: UpdateClientDto,
  ) {
    const userId = 1;
    return this.clientService.updateClient(id, updateClientDto, userId);
  }

  //Read
  @Get()
  async findAll() {
    const userId = 1;
    return this.clientService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const userId = 1;
    return this.clientService.findOne(id, userId);
  }

  @Get('type/:type')
  async findByType(@Param('type') type: string) {
    const userId = 1;
    return this.clientService.findByType(type, userId);
  }

  @Get('search')
  async searchClients(@Query('q') searchTerm: string) {
    const userId = 1;
    return this.clientService.searchClients(searchTerm, userId);
  }

  //Delete
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteClient(@Param('id', ParseIntPipe) id: number) {
    const userId = 1;
    return this.clientService.deleteClient(id, userId);
  }
}
