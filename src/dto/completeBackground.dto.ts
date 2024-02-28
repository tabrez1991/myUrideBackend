import { IsNotEmpty, IsString } from 'class-validator';

export class CompleteBackgroundCheck {
  @IsString()
  @IsNotEmpty()
  id: string;
}
