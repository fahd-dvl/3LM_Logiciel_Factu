import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaysService } from './pays.service';

@Controller('pays')
@UseGuards(AuthGuard('jwt'))
export class PaysController {
  constructor(private readonly paysService: PaysService) {}

  @Get()
  findAll() {
    return this.paysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paysService.findOne(id);
  }

  @Get(':id/regles')
  findRegles(@Param('id', ParseIntPipe) id: number) {
    return this.paysService.findReglesLegales(id);
  }
}
