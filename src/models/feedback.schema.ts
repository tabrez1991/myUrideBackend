import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Feedback extends Document {
  @Prop({ type: String, unique: true })
  profile_id: string;

  @Prop({ type: String })
  fullname: string;

  @Prop({ type: String })
  mobile: string;

  @Prop({ type: String })
  description: string;

  @Prop({ type: Number })
  rating: number;

  @Prop({ type: Date, default: Date.now })
  created_date: Date;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
