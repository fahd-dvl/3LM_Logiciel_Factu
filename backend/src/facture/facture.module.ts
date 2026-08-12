import { Module } from '@nestjs/common';
import { FactureService } from './facture.service';
import { CommonModule } from 'src/common/common.module';
import { PdfModule } from 'src/pdf-client/pdf-client.module';

@Module({
  imports: [CommonModule, PdfModule],
  providers: [FactureService],
  exports: [FactureService],
})
export class FactureModule {}
