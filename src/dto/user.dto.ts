import { IsMobilePhone, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../enums/roles.enum';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsMobilePhone()
  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  profile_picture: any;

  @IsString()
  @IsNotEmpty()
  roles: UserRole[];
}
