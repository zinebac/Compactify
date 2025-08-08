/*eslint-disable*/

import { UnauthorizedException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private configService: ConfigService,
		private prisma: PrismaService,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			secretOrKey: configService.get<string>('JWT_SECRET'),
		});
	}

	async validate(payload: { sub: string; email: string }) {
		const user = await this.prisma.user.findUnique({
			where: { id: payload.sub },
		});

		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		return user;
	}
}
