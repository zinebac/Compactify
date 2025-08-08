import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
	constructor(configService: ConfigService) {
		super({
			clientID: configService.get('GOOGLE_CLIENT_ID'),
			clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
			callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
			scope: ['email', 'profile'],
		});
	}

	async validate(accessToken: string, refreshToken: string, profile: Profile) {
		const { id, displayName, emails, photos } = profile;
		const email = emails && emails[0] ? emails[0].value : null;

		const user = {
			providerId: id,
			email: email,
			name: displayName,
			picture: photos && photos[0] ? photos[0].value : null,
			provider: 'GOOGLE',
			accessToken,
			refreshToken,
		};

		// console.log('🔍 Google profile mapped:', user);
		return user;
	}
}