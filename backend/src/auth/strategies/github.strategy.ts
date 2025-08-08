import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
	constructor(configService: ConfigService) {
		super({
			clientID: configService.get<string>('GITHUB_CLIENT_ID'),
			clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET'),
			callbackURL: configService.get<string>('GITHUB_CALLBACK_URL'),
			scope: ['user:email'],
		});
	}

	async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
		const { id, username, emails, photos } = profile;

		const user = {
			providerId: id.toString(),
			email: emails && emails[0] ? emails[0].value : null,
			name: profile.displayName || username,
			username: username,
			picture: photos && photos[0] ? photos[0].value : null,
			provider: 'GITHUB',
			accessToken,
			refreshToken,
		};

		return user;
	}
}