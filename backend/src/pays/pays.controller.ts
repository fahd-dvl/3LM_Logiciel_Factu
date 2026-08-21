import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaysService } from './pays.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('pays')
export class PaysController {
  constructor(private readonly paysService: PaysService) {}

  @Get()
  @Public()
  findAll() {
    return this.paysService.findAll();
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.paysService.findOne(id);
  }

  @Get(':id/regles')
  @UseGuards(AuthGuard('jwt'))
  findRegles(@Param('id', ParseIntPipe) id: number) {
    return this.paysService.findReglesLegales(id);
  }

  @Public()
  @Get('iso/:codeIso/regles')
  async findReglesByCodeIso(@Param('codeIso') codeIso: string) {
    try {
      return await this.paysService.findReglesByCodeIso(codeIso);
    } catch {
      throw new UnprocessableEntityException(
        `Pays non supporté : '${codeIso}'`,
      );
    }
  }
}
