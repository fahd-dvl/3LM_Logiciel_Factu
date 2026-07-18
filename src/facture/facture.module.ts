import { Module } from '@nestjs/common';
import { FactureService } from './facture.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule],
  providers: [FactureService],
  exports: [FactureService],
})
export class FactureModule {}
