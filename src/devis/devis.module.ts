import { Module } from '@nestjs/common';
import { DevisController } from './devis.controller';
import { DevisService } from './devis.service';
import { CalculService } from 'src/common/services/calcul.service';
import { NumerotationService } from 'src/common/services/numerotation.service';

@Module({
  controllers: [DevisController],
  providers: [DevisService, CalculService, NumerotationService],
  exports: [DevisService],
})
export class DevisModule {}
