
import { IsDate, IsNumber, IsOptional } from 'class-validator';

export class CreateAnalyticsDto {
  @IsDate()
  date: Date;

  @IsNumber()
  clicks: number;

  @IsNumber()
  signups: number;

  @IsNumber()
  earnings: number;
}