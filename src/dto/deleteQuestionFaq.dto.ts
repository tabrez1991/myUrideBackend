import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteQuestionFaqsDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}
