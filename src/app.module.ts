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
import { ClientController } from './client/client.controller';
import { ProduitServiceController } from './produit-service/produit-service.controller';
import { DevisController } from './devis/devis.controller';
import { AuthController } from './auth/auth.controller';
import { DevisModule } from './devis/devis.module';
import { ClientService } from './client/client.service';

@Module({
  imports: [
    // Configuration globale (variables d'environnement)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Modules
    PrismaModule,
    JwtModule,
    DevisModule,
    ClientModule,
    ProduitServiceModule,
    AuthModule,
  ],
  controllers: [
    AppController,
    ClientController,
    ProduitServiceController,
    DevisController,
    AuthController,
  ],
  providers: [AppService],
})
export class AppModule {}
