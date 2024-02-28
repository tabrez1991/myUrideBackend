import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`../config/.env.${process.env.STAGE}`],
      expandVariables: true,
    }),
    MongooseModule.forRoot(
      'mongodb+srv://ansaritarvez:qUm2BXUUdvgSsNfG@cluster0.4tos8iv.mongodb.net/my-uride',
    ),
    // MongooseModule.forRoot('mongodb://127.0.0.1:27017/', {
    //   directConnection: true,
    //   serverSelectionTimeoutMS: 2000,
    //   appName: 'mongosh 2.0.1',
    //   // Add other connection options as needed
    // }),
    UserModule,
    AuthModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
