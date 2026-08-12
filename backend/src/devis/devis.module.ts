import { Module } from '@nestjs/common';
import { DevisController } from './devis.controller';
import { DevisService } from './devis.service';
import { CalculService } from 'src/common/services/calcul.service';
import { NumerotationService } from 'src/common/services/numerotation.service';
import { PdfModule } from 'src/pdf-client/pdf-client.module';
import { PdfClientService } from 'src/pdf-client/pdf-client.service';

@Module({
  controllers: [DevisController],
  providers: [
    DevisService,
    CalculService,
    NumerotationService,
    PdfClientService,
  ],
  exports: [DevisService],
})
export class DevisModule {}
