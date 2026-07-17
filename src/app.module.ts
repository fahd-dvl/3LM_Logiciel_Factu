import { Module } from '@nestjs/common';
import 'dotenv/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';

import { ConfigModule } from '@nestjs/config';

import { ProduitServiceModule } from './produit-service/produit-service.module';
import { ClientModule } from './client/client.module';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    // Configuration globale (variables d'environnement)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Modules
    PrismaModule,
    JwtModule.register({}),
    // ← Authentification
    ClientModule, // ← Gestion des clients
    ProduitServiceModule,
    AuthModule, // ← Gestion des produits/services
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
