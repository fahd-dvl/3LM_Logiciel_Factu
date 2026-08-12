import { Module } from '@nestjs/common';
import { EntrepriseController } from './entreprise.controller';
import { EntrepriseService } from './entreprise.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EntrepriseController],
  providers: [EntrepriseService],
  exports: [EntrepriseService], // utile pour le futur AuthService (résolution entreprise active)
})
export class EntrepriseModule {}
