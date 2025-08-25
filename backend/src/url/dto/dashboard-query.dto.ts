import { IsOptional, IsInt, Min, Max, IsIn, IsString } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class DashboardQueryDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100, { message: 'Limit cannot exceed 100' })
	limit?: number = 10;

	@IsOptional()
	@IsIn(['createdAt', 'expiresAt', 'clickCount'], {
		message: 'Sort field must be one of: createdAt, expiresAt, clickCount'
	})
	sortBy?: 'createdAt' | 'expiresAt' | 'clickCount' = 'createdAt';

	@IsOptional()
	@IsIn(['asc', 'desc'], {
		message: 'Sort order must be either asc or desc'
	})
	sortOrder?: 'asc' | 'desc' = 'desc';

	@IsOptional()
	@IsIn(['all', 'active', 'expired'], {
		message: 'Filter must be one of: all, active, expired'
	})
	filter?: 'all' | 'active' | 'expired' = 'all';

	@IsOptional()
	@IsString()
	@Transform(({ value }) => value?.trim() || '')
	search?: string = '';
}