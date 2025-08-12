import { BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('url')
@UseGuards(ThrottlerGuard)
export class UrlController {
	constructor(private readonly urlService: UrlService) {}
	private readonly logger = new Logger(UrlController.name);

	@Post('create-anonymous')
	@Throttle({ default: { limit: 5, ttl: 60 } })
	async createAnonymousUrl(@Body() url: CreateUrlDto) {
		try {
			return await this.urlService.createAnonymousUrl(url);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
	
	@Get('dashboard')
	@UseGuards(JwtAuthGuard)
	async getDashboard(
		@Req() req,
		@Query('page') page: number = 1,
		@Query('limit') limit: number = 10,
		@Query('sort') sort: 'createdAt' | 'expiresAt' | 'clickCount' = 'createdAt',
		@Query('order') order: 'asc' | 'desc' = 'desc',
		@Query('filter') filter: 'active' | 'expired' | 'all' = 'all',
		@Query('search') search: string = '',
	) {
		try {
			const userId = req.user?.id;
			const query = {
				page: page,
				limit: limit,
				sortBy: sort,
				sortOrder: order,
				search: search,
				filter: filter
			}
			this.logger.log(`Dashboard query: ${JSON.stringify(query)}, uid: ${userId}`);
			if (!userId) {
				throw new BadRequestException('User not authenticated');
			}
			return await this.urlService.getDashboard(userId, query);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
	
	@Get(':shortCode')
	async getUrl(@Param('shortCode') shortCode: string, @Res() res) {
		try {
			const url = await this.urlService.getUrl(shortCode);
			return res.redirect(url.originalUrl);
		} catch (error) {
			if (error instanceof NotFoundException)
				return res.status(404).send(error.message);
			return res.status(500).send('Internal Server Error');
		}
	}

	@Post('create')
	@UseGuards(JwtAuthGuard)
	async createUrl(@Body() url: CreateUrlDto) {
		try {
			return await this.urlService.createAuthUrl(url);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
}