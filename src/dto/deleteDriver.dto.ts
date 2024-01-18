import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteDriverDTO {
  @IsString()
  @IsNotEmpty()
  email: string;
}
