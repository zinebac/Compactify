import { BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { ExtendUrlDto } from './dto/extend-url.dto';

@Controller('url')
@UseGuards(ThrottlerGuard)
export class UrlController {
	constructor(private readonly urlService: UrlService) {}
	private readonly logger = new Logger(UrlController.name);

	@Post('create-anonymous')
	@Throttle({ default: { limit: 5, ttl: 60000 } })
	async createAnonymousUrl(@Body() url: CreateUrlDto) {
		try {
			return await this.urlService.createAnonymousUrl(url);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
	
	@Get('dashboard')
	@UseGuards(JwtAuthGuard)
	@SkipThrottle()
	async getDashboard(
		@Req() req,
		@Query() query: DashboardQueryDto,
	) {
		try {
			const userId = req.user?.id;
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
	@SkipThrottle()
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
	@SkipThrottle()
	async createUrl(@Body() url: CreateUrlDto) {
		try {
			return await this.urlService.createAuthUrl(url);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Delete('delete-all')
	@UseGuards(JwtAuthGuard)
	async deleteAllUrl(@Req() req) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				throw new BadRequestException('User not authenticated');
			}
			return await this.urlService.deleteAllUrl(userId);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Delete('delete/:id')
	@UseGuards(JwtAuthGuard)
	async deleteUrl(@Param('id') urlId: string, @Req() req) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				throw new BadRequestException('User not authenticated');
			}
			return await this.urlService.deleteUrl(userId, urlId);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Put('extend/:id')
	@UseGuards(JwtAuthGuard)
	async extendUrl(@Param('id') urlId: string, @Body() dto: ExtendUrlDto, @Req() req) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				throw new BadRequestException('User not authenticated');
			}
			return await this.urlService.extendUrl(userId, urlId, dto.expiresAt);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}

	@Put('regenerate/:id')
	@UseGuards(JwtAuthGuard)
	async regenerateUrl(@Param('id') urlId: string, @Req() req) {
		try {
			const userId = req.user?.id;
			if (!userId) {
				throw new BadRequestException('User not authenticated');
			}
			return await this.urlService.regenerateUrl(userId, urlId);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
}