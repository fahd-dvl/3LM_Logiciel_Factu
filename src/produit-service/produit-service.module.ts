import { Module } from '@nestjs/common';
import { ProduitServiceController } from './produit-service.controller';
import { ProduitServiceService } from './produit-service.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ProduitServiceController],
  providers: [ProduitServiceService, PrismaService],
})
export class ProduitServiceModule {}
