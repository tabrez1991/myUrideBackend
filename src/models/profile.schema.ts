import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Profile extends Document {
  @Prop({ type: String, unique: true })
  profile_id: string;

  @Prop({ type: String })
  fullname: string;

  @Prop({ type: String })
  university_name: string;

  @Prop({ type: String })
  student_id: string;

  @Prop({ type: String })
  university_address: string;

  @Prop({ type: String })
  mobile_no: string;

  @Prop({ type: String })
  gender: string;

  @Prop({ type: String, default: null })
  car_model: string;

  @Prop({ type: String, default: null })
  make: string;

  @Prop({ type: String, default: null })
  year: string;

  @Prop({ type: String, default: null })
  upload_vehicle_registration: string;

  @Prop({ type: String, default: null })
  upload_driver_licence: string;

  @Prop({ type: String, default: null })
  upload_inssurance_card: string;

  @Prop({ type: String, default: null })
  vehicle_license_plate_number: string;

  @Prop({ type: String })
  destination_contact_number: string;

  @Prop({ type: Number, default: null })
  type: number;

  @Prop({ type: String })
  gender_preferences: string;

  @Prop({ type: String, default: null })
  rider_preference: string;

  @Prop({ type: String })
  phone_code: string;

  @Prop({ type: String, default: null })
  phone_no: string;

  @Prop({ type: String })
  profile_photo: string;

  @Prop({ type: Number })
  rating: number;

  @Prop({ type: Date, default: Date.now })
  created_date: Date;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
