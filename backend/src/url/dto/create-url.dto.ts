import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateUrlDto {
  @IsString()
  @IsUrl()
  @IsNotEmpty()
  originalUrl: string;
}