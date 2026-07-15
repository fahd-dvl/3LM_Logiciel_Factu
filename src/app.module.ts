import { Module } from '@nestjs/common';
import 'dotenv/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';

import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { JwtModule } from './jwt/jwt.module';
import { ConfigModule } from './config/config.module';
import { ClientService } from './client/client.service';
import { ClientModule } from './client/client.module';
import { ProduitServiceModule } from './produit-service/produit-service.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    UserModule,
    JwtModule,
    ConfigModule,
    ClientModule,
    ProduitServiceModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, UserService, ClientService],
})
export class AppModule {}
