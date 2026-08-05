import { Module } from '@nestjs/common';
import { PaysController } from './pays.controller';
import { PaysService } from './pays.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaysController],
  providers: [PaysService],
  exports: [PaysService], // utile pour PaysResolutionService côté chatbot, et pour d'autres modules
})
export class PaysModule {}
