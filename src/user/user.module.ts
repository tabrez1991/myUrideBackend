import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from '../models/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    // MulterModule.register({
    //   dest: './uploads',
    // }),
  ],
  providers: [UserService],
  controllers: [],
  exports: [UserService],
})
export class UserModule {}
