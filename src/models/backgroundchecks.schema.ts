import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class BackgroundChecks extends Document {
  @Prop({ type: String, unique: true })
  driver_id: string;

  @Prop({ type: String })
  legal_first_name: string;

  @Prop({ type: String })
  legal_middle_name: string;

  @Prop({ type: String })
  legal_last_name: string;

  @Prop({ type: String })
  university_address: string;

  @Prop({ type: String })
  license_number: string;

  @Prop({ type: String })
  license_state: string;

  @Prop({ type: String, })
  zip_code: string;

  @Prop({ type: String })
  dob: string;

  @Prop({ type: String, default: null })
  ssn: string;

  @Prop({ type: Number })
  status: number;

  @Prop({ type: Date, default: Date.now })
  created_date: Date;
}

export const BackgroundChecksSchema = SchemaFactory.createForClass(BackgroundChecks);
