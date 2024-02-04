import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Settings extends Document {
  @Prop({ type: String, })
  privacy_policy: string;

  @Prop({ type: String })
  user_agreement: string;

  @Prop({ type: String })
  user_guidlines: string;

  @Prop({ type: String })
  driver_agreements: string;

  @Prop({ type: Date, default: Date.now })
  created_date: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
