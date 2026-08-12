import { Module } from '@nestjs/common';
import { PaiementController } from './paiement.controller';
import { PaiementService } from './paiement.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FactureModule } from '../facture/facture.module';

@Module({
  imports: [PrismaModule, FactureModule],
  controllers: [PaiementController],
  providers: [PaiementService],
})
export class PaiementModule {}
