import { IsNotEmpty, IsString } from 'class-validator';

export class LogoutUserDTO {
  @IsString()
  @IsNotEmpty()
  email: string;
}
