import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(PrismaService.name);

	constructor() {
		super({
			log: process.env.NODE_ENV === 'development'
				? ['query', 'info', 'warn', 'error']
				: ['warn', 'error'],
			errorFormat: 'pretty',
		})
	}

	async onModuleInit() {
		this.logger.log('Initializing Prisma Service...');
		await this.$connect();
	}

	async onModuleDestroy() {
		this.logger.log('Destroying Prisma Service...');
		await this.$disconnect();
	}
}
