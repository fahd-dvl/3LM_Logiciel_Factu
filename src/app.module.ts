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
import { FactureService } from './facture/facture.service';
import { FactureController } from './facture/facture.controller';
import { FactureModule } from './facture/facture.module';
import { CalculService } from './common/services/calcul.service';
import { NumerotationService } from './common/services/numerotation.service';
import { PaiementController } from './paiement/paiement.controller';
import { PaiementService } from './paiement/paiement.service';
import { PaiementModule } from './paiement/paiement.module';

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
    FactureModule,
    PaiementModule,
  ],
  controllers: [
    AppController,
    ClientController,
    ProduitServiceController,
    DevisController,
    AuthController,
    FactureController,
    PaiementController,
  ],
  providers: [AppService, FactureService, CalculService, NumerotationService, PaiementService],
})
export class AppModule {}
