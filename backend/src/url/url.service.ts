import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import * as base62 from 'base62';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { Prisma } from '@prisma/client';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { DashboardResponseDto, DashboardUrlDto } from './dto/url-response.dto';

const URL_CONFIG = {
	ANONYMOUS_EXPIRY_DAYS: parseInt(process.env.URL_ANONYMOUS_EXPIRY_LENGTH),
	MAX_URLS_PER_USER: parseInt(process.env.URL_MAX_PER_USER) || 50,
	SHORT_CODE_LENGTH: parseInt(process.env.URL_SHORT_CODE_LENGTH) || 8,
	MAX_RETRIES: parseInt(process.env.URL_GENERATION_MAX_RETRIES) || 5,
	MAX_URL_LENGTH: parseInt(process.env.MAX_URL_LENGTH) || 2048,
	BASE_URL: process.env.BACKEND_URL,
};

// custom exception for URL validation

export class InvalidUrlError extends BadRequestException {
	constructor(message = 'Invalid URL provided') {
		super(message);
	}
}

export class UrlNotFoundError extends NotFoundException {
	constructor(identifier: string) {
		super(`URL not found: ${identifier}`);
	}
}

@Injectable()
export class UrlService {
	constructor(private readonly prisma: PrismaService) {}
	private readonly logger = new Logger(UrlService.name);

	@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
	async deleteExpiredUrls() {
		try {
			const now = new Date();
			const [totalDeleted, totalDeactivated] = await this.prisma.$transaction([
				this.prisma.url.deleteMany({
					where: {
						expiresAt: {
							lte: now,
						},
						userId: null,
					},
				}),
				this.prisma.url.updateMany({
					where: {
						expiresAt: {
							lte: now,
						},
						userId: { not: null},
					},
					data: {
						isActive: false,
					},
				}),

			]);

			this.logger.log(`Total URLs deleted: ${totalDeleted.count}, Total URLs deactivated: ${totalDeactivated.count}`);
		} catch (error) {
			this.logger.error('Error deleting expired URLs', error);
		}
	}

	private isValidUrl(url: string): boolean {
		if (typeof url !== 'string' || !url?.trim() || url.length > URL_CONFIG.MAX_URL_LENGTH) {
			throw new InvalidUrlError('URL must be a non-empty string and less than 2048 characters');
		}
		let parsedUrl = new URL(url);
		if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
			throw new InvalidUrlError('Only HTTP and HTTPS URLs are allowed');
		}
		return true;
	}

	private generateShortCode(originalUrl: string, attempt: number = 0): string {
		const input = attempt > 0 ? `${originalUrl}${attempt}${Date.now()}` : originalUrl;
		const hash = CryptoJS.SHA256(input).toString();
		return base62.encode(parseInt(hash.slice(0, URL_CONFIG.SHORT_CODE_LENGTH), 16));
	}

	private async generateUniqueShortCode(originalUrl: string): Promise<string> {
		for (let attempt = 0; attempt < URL_CONFIG.MAX_RETRIES; attempt++) {
			const shortCode = this.generateShortCode(originalUrl, attempt);
			
			// Check for collision
			const existing = await this.prisma.url.findUnique({
				where: { shortCode },
				select: { id: true },
			});
		
			if (!existing) {
				return shortCode;
			}
		}
	
		throw new BadRequestException('Unable to generate unique short code. Please try again.');
	}

	async createAnonymousUrl(url: CreateUrlDto) {
		try {
			const { originalUrl } = url;
			this.isValidUrl(originalUrl);
	
			const shortCode = await this.generateUniqueShortCode(originalUrl);
			const expiresAtDate = new Date(Date.now() + URL_CONFIG.ANONYMOUS_EXPIRY_DAYS);
			
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
			const result = await this.prisma.$transaction(async (tx) => {
				const url = await tx.url.findUnique({
					where: {
						shortCode
					}
				})

				if (!url) throw new UrlNotFoundError(shortCode);

				if (url.expiresAt && new Date(url.expiresAt) < new Date()) throw new Error('Expired URL');

				const update = tx.url.update({
					where: { shortCode },
					data: {
						clickCount: (url.clickCount || 0) + 1,
					},
				});

				if (!update) throw new Error('Failed to update url');

				return url;
			})

			return result;
		} catch (error) {
			if (error instanceof UrlNotFoundError)
				throw new UrlNotFoundError('URL not found');
			throw new BadRequestException('Error retrieving URL');
		}
	}

	async createAuthUrl(url: CreateUrlDto) {
		try {
			const { originalUrl, expiresAt, uid } = url;
			this.isValidUrl(originalUrl);

			if (expiresAt && new Date(expiresAt) <= new Date()) {
				throw new BadRequestException('Expiration date must be in the future');
			}

			const user = await this.prisma.user.findUnique({
				where: { id: uid },
			});

			if (!uid || !user) {
				throw new BadRequestException('User not found');
			}

			// check number of created URLs by user
			const userUrlsCount = await this.prisma.url.count({
				where: { userId: uid },
			});

			if (userUrlsCount >=  URL_CONFIG.MAX_URLS_PER_USER) {
				// this.logger.error('User has reached the limit of 100 URLs');
				throw new BadRequestException('User has reached the limit of 100 URLs');
			}

			const shortCode = await this.generateUniqueShortCode(originalUrl);
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

	async getDashboard(uid: string, query: DashboardQueryDto): Promise<DashboardResponseDto> {
		const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', filter = 'all', search = '' } = query;
		const skip = (page - 1) * limit;
		const where: any = {
			userId: uid,
			...(search && {
				originalUrl: {
					contains: search,
					mode: Prisma.QueryMode.insensitive,
				}
			})
		};

		if (filter === 'active') {
			where.OR = [
				{ isActive: true }
			]
		} else if (filter === 'expired') {
			where.OR = [
				{ isActive: false },
				{ expiresAt: { lte: new Date() } }
			]
		}

		const [urls, totalUrls] = await this.prisma.$transaction([
			this.prisma.url.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
			}),
			this.prisma.url.count({ where }),
		]);

		const transformedUrls: DashboardUrlDto[] = urls.map(url => ({
			id: url.id,
			shortenedUrl: `${URL_CONFIG.BASE_URL}/url/${url.shortCode}`,
			originalUrl: url.originalUrl,
			clicks: url.clickCount || 0,
			expiresAt: url.expiresAt ? url.expiresAt.toISOString() : null,
			createdAt: url.createdAt.toISOString(),
		}));

		return {
			urls: transformedUrls,
			pagination: {
				currentPage: page,
				totalPages: Math.ceil(totalUrls / limit),
				totalUrls,
				limit,
			},
			stats: {
				totalClicks: transformedUrls.reduce((acc, url) => acc + url.clicks, 0),
			},
		};
	}

	async deleteAllUrl (uid: string) {
		try {
			const url = await this.prisma.url.deleteMany({
				where: {
					userId: uid,
				},
			})

			if (!url) {
				throw new NotFoundException('URL not found');
			}

			// this.logger.log(`URLs deleted successfully for user ${uid}`);
			return { message: 'URL deleted successfully' };

		} catch (error) {
			// this.logger.error(error.message)
			if (error instanceof NotFoundException) {
				throw new NotFoundException('No URLs found for deletion');
			}
			throw new BadRequestException('Error deleting URLs');
		}
	}

	async deleteUrl (uid: string, urlId: string) {
		try {

			const url = await this.prisma.url.deleteMany({
				where: {
					id: urlId,
					userId: uid,
				}
			})

			if (!url) {
				throw new NotFoundException('URL not found');
			}

			// this.logger.log(`URL with ID ${urlId} deleted successfully for user ${uid}`);
			return { message: 'URL deleted successfully' };

		} catch (error) {
			this.logger.error(error.message)
			if (error instanceof NotFoundException) {
				throw new NotFoundException('URL not found');
			}
			throw new BadRequestException('Error deleting URL');
		}
	}

	async extendUrl(uid: string, urlId: string, expiresAt: string) {
		try {
			const url = await this.prisma.url.findUnique({
				where: { id: urlId, userId: uid },
			})

			if (!url) {
				throw new NotFoundException('URL not found');
			}

			if (expiresAt && (new Date(expiresAt) <= new Date())) {
				throw new BadRequestException('Expiration date must be in the future');
			}

			const expiresAtDate = new Date(expiresAt);
			const updatedUrl = await this.prisma.url.update({
				where: { id: urlId, userId: uid },
				data: {
					expiresAt: expiresAtDate,
				},
			})

			if (!updatedUrl) {
				throw new BadRequestException('Failed to update expiration date');
			}

			return {message: 'URL lifetime extended successfully', expiresAt: updatedUrl.expiresAt.toISOString()};
		} catch(error) {
			if (error instanceof NotFoundException) {
				throw new NotFoundException('URL not found');
			}
			throw new BadRequestException('Error extending URL lifetime');
		}
	}

	async regenerateUrl(uid: string, urlId: string) {
		try {
			const url = await this.prisma.url.findUnique({
				where: { id: urlId, userId: uid },
			})

			if (!url) {
				throw new NotFoundException('URL not found');
			}

			const newShortCode = await this.generateUniqueShortCode(url.originalUrl);
			const updatedUrl = await this.prisma.url.update({
				where: { id: urlId, userId: uid },
				data: {
					shortCode: newShortCode,
				},
			})

			if (!updatedUrl) {
				throw new Error('Could not update url')
			}

			return {
				shortenedUrl: `${process.env.BACKEND_URL}/url/${newShortCode}`,
				id: updatedUrl.id,
			};
		} catch(error) {
			throw new BadRequestException('Error regenerating URL');
		}
	}
}
