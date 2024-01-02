import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose/dist/mongoose.module';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`src/config/.env.${process.env.STAGE}`],
      expandVariables: true,
    }),
    MongooseModule.forRoot(
      'mongodb+srv://ansaritarvez:qUm2BXUUdvgSsNfG@cluster0.4tos8iv.mongodb.net/my-uride',
    ),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
