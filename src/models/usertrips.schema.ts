import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Document } from 'mongoose';

@Schema()
export class UserTrips extends Document {
  @Prop({ type: ObjectId})
  _id: string;
  
  @Prop({ type: String, })
  userid: string;

  @Prop({ type: Number })
  type: number;

  @Prop({ type: String })
  actionType: string;

  @Prop({ type: String })
  pickup_location: string;

  @Prop({ type: Number })
  pickup_lat: number;

  @Prop({ type: Number })
  pickup_long: number;

  @Prop({ type: String })
  destination_location: string;

  @Prop({ type: Number })
  destination_lat: number;

  @Prop({ type: Number })
  destination_long: number;

  @Prop({ type: String })
  trip_distance: string;

  @Prop({ type: String })
  trip_time: string;

  @Prop({ type: String })
  trip: string;

  @Prop({ type: String })
  depart_date_time: string;

  @Prop({ type: String })
  return_date_time: string;

  @Prop({ type: Number })
  amount: number;

  @Prop({ type: String })
  payment: string;

  @Prop({ type: String, default: null })
  request_expiration: string;

  @Prop({ type: Number })
  number_of_riders: number;

  @Prop({ type: Number })
  number_of_bags: number;

  @Prop({ type: String, default: null })
  special_request: string;

  @Prop({ type: Number })
  status: number;

  @Prop({ type: Number })
  trip_accepted: number;

  @Prop({ type: Number })
  seat_left_need: number;

  @Prop({ type: Number })
  is_trip_full: number;

  @Prop({ type: Number })
  received_offer: number;

  @Prop({ type: Date, default: Date.now })
  created_date: Date;

  @Prop({ type: Date, default: Date.now })
  updated_date: Date;
}

export const UserTripsSchema = SchemaFactory.createForClass(UserTrips);
