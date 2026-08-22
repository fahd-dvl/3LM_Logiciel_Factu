import { Module } from '@nestjs/common';
import 'dotenv/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

import { ProduitServiceModule } from './produit-service/produit-service.module';
import { ClientModule } from './client/client.module';
import { AuthModule } from './auth/auth.module';
import { DevisModule } from './devis/devis.module';
import { FactureModule } from './facture/facture.module';
import { PaiementModule } from './paiement/paiement.module';
import { EntrepriseModule } from './entreprise/entreprise.module';
import { FournisseurModule } from './fournisseur/fournisseur.module';
import { DepenseModule } from './depense/depense.module';
import { PaysModule } from './pays/pays.module';
import { PdfModule } from './pdf-client/pdf-client.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { ChatModule } from './chat/chat.module';

import { CalculService } from './common/services/calcul.service';
import { NumerotationService } from './common/services/numerotation.service';
import { UtilisateurModule } from './utilisateur/utilisateur.module';
import { TauxTvaService } from './taux-tva/taux-tva.service';
import { TauxTvaController } from './taux-tva/taux-tva.controller';
import { TauxTvaModule } from './taux-tva/taux-tva.module';
import { CategorieService } from './categorie/categorie.service';
import { CategorieController } from './categorie/categorie.controller';
import { CategorieModule } from './categorie/categorie.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    JwtModule,
    DevisModule,
    ClientModule,
    ProduitServiceModule,
    AuthModule,
    FactureModule,
    PaiementModule,
    EntrepriseModule,
    FournisseurModule,
    DepenseModule,
    PaysModule,
    PdfModule,
    DashboardModule,
    ChatModule,
    UtilisateurModule,
    TauxTvaModule,
    CategorieModule,
  ],
  controllers: [AppController, TauxTvaController, CategorieController],
  providers: [AppService, CalculService, NumerotationService, TauxTvaService, CategorieService],
})
export class AppModule {}
