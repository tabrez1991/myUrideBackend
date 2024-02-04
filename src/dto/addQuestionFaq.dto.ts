import { IsNotEmpty, IsString } from 'class-validator';

export class AddQuestionFaqsDto {
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
