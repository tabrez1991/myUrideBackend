import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class SignUps extends Document {
  @Prop({ type: String, unique: true, required: true })
  email: string;

  @Prop({ type: String, unique: true, required: true })
  username: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, })
  device_id: string;

  @Prop({ type: String, })
  device_token: string;

  @Prop({ type: String, })
  device_type: string;

  @Prop({ type: Number, })
  email_verified: number;

  @Prop({ type: String, default: null })
  jwttoken: string;

  @Prop({ type: Number, })
  otp: number;

  @Prop({ type: String, default: null })
  refreshToken: string;

  @Prop({ type: Number, required: true })
  role_id: number;

  @Prop({ type: Date, default: Date.now })
  created_date: Date;

  @Prop({ type: Number, required: true })
  status: number;
}

export const SignUpsSchema = SchemaFactory.createForClass(SignUps);
