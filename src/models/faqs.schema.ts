import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Faqs extends Document {
  @Prop({ type: String })
  queston: string;

  @Prop({ type: String })
  answer: string;

  @Prop({ type: String })
  category: string;

  @Prop({ type: Date, default: Date.now })
  created_date: Date;
}

export const FaqsSchema = SchemaFactory.createForClass(Faqs);
