import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DevisService } from './devis.service';
import { CreateDevisDto } from './dto/create-devis.dto';
import { UpdateDevisDto } from './dto/update-devis.dto';
import { ChangeStatutDevisDto } from './dto/change-statut-devis.dto';
import { StatutDevis } from 'generated/prisma/browser';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
// import { AuthGuard } from '../auth/auth.guard';
// import { CurrentUser } from '../auth/current-user.decorator';

@Controller('devis')
// @UseGuards(AuthGuard)
export class DevisController {
  constructor(private readonly devisService: DevisService) {}

  @Post()
  create(@Body() dto: CreateDevisDto, @CurrentUser() user: any) {
    return this.devisService.creer(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: any,

    @Query('statut') statut?: StatutDevis,
  ) {
    return this.devisService.findAll(user.id, statut);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.devisService.findOne(user.id, id);
  }

  @Put(':id')
  update(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDevisDto,
  ) {
    return this.devisService.update(user.id, id, dto);
  }

  @Patch(':id/statut')
  changerStatut(
    @CurrentUser() user: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeStatutDevisDto,
  ) {
    return this.devisService.changerStatut(user.id, id, dto.statut);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: any) {
    return this.devisService.remove(user.id, id);
  }
}
