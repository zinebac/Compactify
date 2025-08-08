import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';

export class CreateAuthUrlDto {
	@IsString()
	@IsUrl()
	@IsNotEmpty()
	originalUrl: string;

	@IsOptional()
	@IsDateString()
	expiresAt?: string;

	@IsUUID()
	uid: string;
}