import { Module } from '@nestjs/common';
import { CalculService } from 'src/common/services/calcul.service';
import { NumerotationService } from 'src/common/services/numerotation.service';

@Module({
  providers: [CalculService, NumerotationService],
})
export class FactureModule {}
