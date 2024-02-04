import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateQuestionFaqsDto {
  @IsNotEmpty()
  @IsString()
  id: string;

  @IsNotEmpty()
  @IsString()
  questions: string;

  @IsNotEmpty()
  @IsString()
  answer: string;

  @IsNotEmpty()
  @IsString()
  category: string;
}
