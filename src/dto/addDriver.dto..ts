import { IsNotEmpty, IsString } from 'class-validator';

export class AddDriverDto {
  @IsNotEmpty()
  type: number;

  profile_picture: any;

  @IsString()
  university_name: string;

  @IsString()
  student_id: string;

  @IsString()
  university_address: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  gender: string;

  @IsString()
  destination_contact_number: string;

  @IsString()
  gender_preferences: string;

  @IsString()
  rider_preference: string;

  @IsString()
  phone_code: string;

  @IsString()
  phone_no: string;

  @IsString()
  @IsNotEmpty()
  legal_first_name: string;

  @IsString()
  legal_middle_name: string;

  @IsString()
  @IsNotEmpty()
  legal_last_name: string;

  @IsString()
  license_number: string;

  @IsString()
  license_state: string;


  @IsString()
  zip_code: string;

  @IsString()
  @IsNotEmpty()
  dob: string;

  @IsString()
  ssn: string;

  @IsString()
  make: string;

  @IsString()
  model: string;

  @IsString()
  year: string;


  upload_vehicle_registration: string;

  upload_driver_licence: string;

  upload_inssurance_card: string;

  @IsString()
  car_model: string;

  @IsString()
  vehicle_license_plate_number: string;

}
