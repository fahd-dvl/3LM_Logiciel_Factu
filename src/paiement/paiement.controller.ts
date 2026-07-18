import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PaiementService } from './paiement.service';
import { CreatePaiementDto } from './dto/create-paiement.dto';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('paiements')
export class PaiementController {
  constructor(private readonly paiementService: PaiementService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreatePaiementDto) {
    return this.paiementService.creer(user.id, dto);
  }

  @Get()
  findAllByFacture(
    @CurrentUser() user: any,
    @Query('facture_id', ParseIntPipe) factureId: number,
  ) {
    return this.paiementService.findAllByFacture(user.id, factureId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.paiementService.findOne(user.id, id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.paiementService.remove(user.id, id);
  }
}
