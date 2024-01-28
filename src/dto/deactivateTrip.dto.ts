import { IsNotEmpty, IsString } from 'class-validator';

export class DeactiveTripDTO {
  @IsString()
  @IsNotEmpty()
  tripId: string;
}
