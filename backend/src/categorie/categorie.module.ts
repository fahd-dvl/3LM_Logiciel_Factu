// src/categorie/categorie.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategorieController } from './categorie.controller';
import { CategorieService } from './categorie.service';

@Module({
  imports: [PrismaModule],
  controllers: [CategorieController],
  providers: [CategorieService],
  exports: [CategorieService],
})
export class CategorieModule {}
