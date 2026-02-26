import { IsDateString, IsNotEmpty, IsString, IsUrl, IsOptional } from 'class-validator';

export class CreateUrlDto {
	@IsString()
	@IsUrl()
	@IsNotEmpty()
	originalUrl: string;

	@IsOptional()
	@IsDateString()
	expiresAt?: string;
}