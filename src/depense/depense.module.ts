import { Module } from '@nestjs/common';
import { DepenseService } from './depense.service';
import { DepenseController } from './depense.controller';
import { CalculService } from 'src/common/services/calcul.service';
import { FournisseurModule } from 'src/fournisseur/fournisseur.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [CommonModule, FournisseurModule],
  providers: [DepenseService],
  controllers: [DepenseController],
})
export class DepenseModule {}
