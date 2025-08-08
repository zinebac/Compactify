import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [UrlController],
    providers: [UrlService],
})
export class UrlModule { }
