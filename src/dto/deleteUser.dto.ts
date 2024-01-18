import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteUserDTO {
  @IsString()
  @IsNotEmpty()
  email: string;
}
