import * as bcrypt from 'bcrypt';
import { UserRole } from '../enums/roles.enum';
import { UserStatus } from 'src/enums/userStatus.enum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ type: String, unique: true, required: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, unique: true, required: true })
  mobile: string;

  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, default: null })
  middleName: string;

  @Prop({ type: String, required: true })
  lastName: string;

  @Prop({ type: Boolean, default: null })
  email_verified: string;

  @Prop({ type: String, required: false, default: null })
  profile_picture: string;

  @Prop({
    type: [
      { type: String, enum: Object.values(UserRole), default: [UserRole.USER] },
    ],
    default: [UserRole.USER],
  })
  roles: UserRole[];

  @Prop({ type: String, required: true, default: UserStatus.ACTIVE })
  status: string;

  @Prop({ type: String, default: null })
  jwttoken: string;

  @Prop({ type: String, default: null })
  refreshToken: string;

  @Prop({ type: Date, default: Date.now })
  creation_date: Date;

  @Prop({ type: Date, default: null })
  last_login: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next: any) {
  try {
    if (!this.isModified('password')) {
      return next();
    }
    const hashed = await bcrypt.hash(this['password'], 10);
    this['password'] = hashed;
    return next();
  } catch (err) {
    return next(err);
  }
});
