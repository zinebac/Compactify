import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import * as base62 from 'base62';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUrlDto } from './dto/create-url.dto';

@Injectable()
export class UrlService {
	constructor(private readonly prisma: PrismaService) {}
	private readonly logger = new Logger(UrlService.name);

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async deleteExpiredUrls() {
		try {
			const now = new Date();
			const deletedUrls = await this.prisma.url.deleteMany({
				where: {
					expiresAt: {
						lte: now,
					},
				},
			});
			this.logger.log(`Deleted ${deletedUrls.count} expired URLs.`);
		} catch (error) {
			this.logger.error('Error deleting expired URLs', error);
		}
	}

	private isValidUrl(url: string): boolean {
		try {
			new URL(url);
			return true;
		} catch (e) {
			return false;
		}
	}

	private generateShortCode(originalUrl: string): string {
		const hash = CryptoJS.SHA256(originalUrl).toString();
		return base62.encode(parseInt(hash.slice(0, 8), 16));
	}

	private async checkCollision(shortCode: string): Promise<boolean> {
		const existingUrl = await this.prisma.url.findUnique({
			where: { shortCode },
		});
		return !!existingUrl;
	}

	async createAnonymousUrl(url: CreateUrlDto) {
		try {
			const { originalUrl } = url;

			if (!originalUrl || !this.isValidUrl(originalUrl)) {
				// this.logger.error('Invalid URL provided');
				throw new BadRequestException('Invalid URL provided');
			}
	
			let shortCode = this.generateShortCode(originalUrl);
			while (await this.checkCollision(shortCode)) {
				shortCode = this.generateShortCode(originalUrl + Math.random().toString(36).substring(2, 7));
			}
	
			const expiresAtDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
	
			const urlData = await this.prisma.url.create({
				data: {
					originalUrl,
					shortCode,
					expiresAt: expiresAtDate,
					userId: null,
				},
			});
	
			const shortenedUrl = `${process.env.BACKEND_URL}/url/${shortCode}`;
	
			const response = {
				originalUrl: urlData.originalUrl,
				shortenedUrl: shortenedUrl,
				expiresAt: urlData.expiresAt,
			}

			return response;
		} catch (error) {
			throw new BadRequestException(error.message || 'Error creating URL');
		}
	}

	async getUrl(shortCode: string) {
		try {
			const url = await this.prisma.url.findUnique({
				where: { shortCode },
			});

			if (!url) {
				this.logger.error(`URL with short code ${shortCode} not found`);
				throw new NotFoundException('URL not found');
			}

			return url;
		} catch (error) {
			this.logger.error(`Error retrieving URL with short code ${shortCode}`, error);
			if (error instanceof NotFoundException)
				throw new NotFoundException('URL not found');
			throw new BadRequestException('Error retrieving URL');
		}
	}

	async createAuthUrl(url: CreateUrlDto) {
		try {
			const { originalUrl, expiresAt, uid } = url;

			if (!originalUrl || !this.isValidUrl(originalUrl)) {
				throw new BadRequestException('Invalid URL provided');
			}

			if (expiresAt && new Date(expiresAt) <= new Date()) {
				// this.logger.error('Expiration date must be in the future');
				throw new BadRequestException('Expiration date must be in the future');
			}

			const user = await this.prisma.user.findUnique({
				where: { id: uid },
			});

			if (!uid || !user) {
				// this.logger.error('User not found');
				throw new BadRequestException('User not found');
			}

			// check number of created URLs by user
			const userUrlsCount = await this.prisma.url.count({
				where: { userId: uid },
			});

			if (userUrlsCount >= 50) {
				// this.logger.error('User has reached the limit of 100 URLs');
				throw new BadRequestException('User has reached the limit of 100 URLs');
			}

			let shortCode = this.generateShortCode(originalUrl);
			while (await this.checkCollision(shortCode)) {
				shortCode = this.generateShortCode(originalUrl + Math.random().toString(36).substring(2, 7));
			}

			const expiresAtDate = expiresAt ? new Date(expiresAt) : null;

			const urlData = await this.prisma.url.create({
				data: {
					originalUrl,
					shortCode,
					expiresAt: expiresAtDate,
					userId: user.id,
				},
			});

			const shortenedUrl = `${process.env.BACKEND_URL}/url/${shortCode}`;

			const response = {
				originalUrl: urlData.originalUrl,
				shortenedUrl: shortenedUrl,
				expiresAt: urlData.expiresAt,
			};

			return response;
		} catch (error) {
			throw new BadRequestException(error.message || 'Error creating URL');
		}
	}
}
