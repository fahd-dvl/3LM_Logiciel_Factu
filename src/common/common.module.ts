import { Module } from '@nestjs/common';
import { CalculService } from './services/calcul.service';
import { NumerotationService } from './services/numerotation.service';

@Module({
  providers: [CalculService, NumerotationService],
  exports: [CalculService, NumerotationService],
})
export class CommonModule {}
