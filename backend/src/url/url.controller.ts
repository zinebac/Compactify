import { BadRequestException, Body, Controller, Delete, Get, Logger, NotFoundException, Param, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';

@Controller('url')
@UseGuards(ThrottlerGuard)
export class UrlController {
	constructor(private readonly urlService: UrlService) {}

	@Post('create-anonymous')
	@Throttle({ default: { limit: 5, ttl: 60 } })
	async createAnonymousUrl(@Body() url: CreateUrlDto) {
		try {
			return await this.urlService.createAnonymousUrl(url);
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
	async createUrl(@Body() url: CreateUrlDto) {
		try {
			return await this.urlService.createAuthUrl(url);
		} catch (error) {
			throw new BadRequestException(error.message);
		}
	}
}
