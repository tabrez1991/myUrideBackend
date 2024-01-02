import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordtDTO {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
