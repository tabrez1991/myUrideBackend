import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  password: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  middleName: string;

  lastName: string;

  profile_picture: any;

  @IsString()
  @IsNotEmpty()
  roles: string[];
}
