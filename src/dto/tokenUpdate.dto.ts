import { IsNotEmpty, IsString } from 'class-validator';

export class TokenUpdateDTO {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  token: string;
}
