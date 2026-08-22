// src/taux-tva/taux-tva.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TauxTvaController } from './taux-tva.controller';
import { TauxTvaService } from './taux-tva.service';

@Module({
  imports: [PrismaModule],
  controllers: [TauxTvaController],
  providers: [TauxTvaService],
  exports: [TauxTvaService],
})
export class TauxTvaModule {}
