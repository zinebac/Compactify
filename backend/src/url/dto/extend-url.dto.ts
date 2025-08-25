import { IsDateString, IsNotEmpty } from 'class-validator';

export class ExtendUrlDto {
	@IsNotEmpty()
	@IsDateString({}, { message: 'Invalid date format for expiresAt' })
	expiresAt: string;
}