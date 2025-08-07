import { PrismaModule } from './prisma/prisma.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
        PrismaModule,
      ],
  controllers: [],
  providers: [],
})
export class AppModule {}
