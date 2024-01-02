import { Document } from 'mongoose';

export interface User extends Document {
  email: string;
  password: string;
  mobile: string;
  name: string;
  email_verified: string;
  profile_picture: string;
  roles: string[];
  status: string;
  jwttoken: string;
  refreshToken: string;
  creation_date: string;
  last_login: string;
}
