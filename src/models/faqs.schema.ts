import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Faqs extends Document {
  @Prop({ type: String })
  title: string;

  @Prop({ type: String })
  desc: string;

  @Prop({ type: Date, default: Date.now })
  updated_date: Date;

  @Prop({ type: Date, default: Date.now })
  created_date: Date;
}

export const FaqsSchema = SchemaFactory.createForClass(Faqs);
