import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { EntrepriseService } from './entreprise.service';
import { CreateEntrepriseDto } from './dto/create-entreprise.dto';
import { UpdateEntrepriseDto } from './dto/update-entreprise.dto';

@Controller('entreprises')
export class EntrepriseController {
  constructor(private readonly entrepriseService: EntrepriseService) {}

  @Post()
  create(@Body() dto: CreateEntrepriseDto) {
    const userId = 1;
    return this.entrepriseService.creer(userId, dto);
  }

  @Get('mes-entreprises')
  findAllMine() {
    const userId = 1;
    return this.entrepriseService.findAllByUtilisateur(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    const userId = 1;
    return this.entrepriseService.findOne(userId, id);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEntrepriseDto,
  ) {
    const userId = 1;
    return this.entrepriseService.update(userId, id, dto);
  }
}
