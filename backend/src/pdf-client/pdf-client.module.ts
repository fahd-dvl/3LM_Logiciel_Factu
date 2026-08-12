import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PdfClientService } from './pdf-client.service';

@Module({
  imports: [ConfigModule],
  providers: [PdfClientService],
  exports: [PdfClientService],
})
export class PdfModule {}
