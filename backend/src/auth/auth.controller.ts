import { Controller, Get, Req, Res, UseGuards, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Get('google')
	@UseGuards(AuthGuard('google'))
	async googleLogin() {
	// Passport handles the redirect
	}

	@Get('google/callback')
	@UseGuards(AuthGuard('google'))
	async googleLoginCallback(@Req() req, @Res() res: Response) {
		return this.handleOAuthCallback(req, res, 'GOOGLE');
	}

	@Get('github')
	@UseGuards(AuthGuard('github'))
	async githubLogin() {
	// Passport handles the redirect
	}

	@Get('github/callback')
	@UseGuards(AuthGuard('github'))
	async githubLoginCallback(@Req() req, @Res() res: Response) {
		return this.handleOAuthCallback(req, res, 'GITHUB');
	}

	@Get('refresh')
	async refreshToken(@Req() req, @Res() res: Response) {
		try {
			const refreshToken = req.cookies?.refresh_token;
			
			if (!refreshToken) {
				return res.status(HttpStatus.UNAUTHORIZED).json({
					success: false,
					message: 'Refresh token not found'
				});
			}

			const result = await this.authService.refreshTokens(refreshToken);
			
			if (!result) {
				this.clearRefreshCookie(res);
				return res.status(HttpStatus.UNAUTHORIZED).json({
					success: false,
					message: 'Invalid refresh token'
				});
			}

			this.setRefreshCookie(res, result.refreshToken);

			return res.json({
				success: true,
				data: {
					accessToken: result.accessToken,
					user: result.user
				}
			});

		} catch (error) {
			this.clearRefreshCookie(res);
			return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: 'Token refresh failed'
			});
		}
	}

	@Get('logout')
	async logout(@Req() req, @Res() res: Response) {
	const refreshToken = req.cookies?.refresh_token;
	
	if (refreshToken) {
		await this.authService.revokeRefreshToken(refreshToken);
	}
	
	this.clearRefreshCookie(res);
	
	return res.json({
		success: true,
		message: 'Logged out successfully'
	});
	}

	private async handleOAuthCallback(req: any, res: Response, provider: 'GOOGLE' | 'GITHUB') {
		try {
			if (!req.user?.email || !req.user?.providerId) {
				throw new Error(`Missing required user data from ${provider}`);
			}

			const result = await this.authService.validateUser(
				req.user.email,
				provider,
				req.user.providerId,
				req.user.name
			);

			this.setRefreshCookie(res, result.refreshToken);

			const authData = {
				accessToken: result.accessToken,
				user: {
					id: result.user.id,
					email: result.user.email,
					name: result.user.name,
					provider: result.user.provider,
					createdAt: result.user.createdAt,
				}
			};

			return res.send(this.generateSuccessHTML(authData));

		} catch (error) {
			return res.send(this.generateErrorHTML(error.message));
		}
	}

	private setRefreshCookie(res: Response, refreshToken: string) {
		res.cookie('refresh_token', refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
	}

	private clearRefreshCookie(res: Response) {
		res.clearCookie('refresh_token');
	}

	private escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#x27;');
	}

	private generateSuccessHTML(authData: any): string {
		const safePayload = JSON.stringify({ accessToken: authData.accessToken, user: authData.user })
			.replace(/</g, '\\u003c');
		const safeFrontendUrl = JSON.stringify(process.env.FRONTEND_URL?.replace(/\/$/, ''));
		return `
			<!DOCTYPE html>
			<html>
				<head>
					<title>Authentication Successful</title>
				</head>
				<body>
					<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
						<h2>Authentication Successful!</h2>
						<p>Closing window...</p>
					</div>
					<script>
						if (window.opener) {
							const data = ${safePayload};
							window.opener.postMessage({
								type: 'OAUTH_SUCCESS',
								accessToken: data.accessToken,
								user: data.user
							}, ${safeFrontendUrl});
						}
						setTimeout(() => window.close(), 1000);
					</script>
				</body>
			</html>
		`;
	}

	private generateErrorHTML(error: string): string {
		const safeErrorJson = JSON.stringify(error).replace(/</g, '\\u003c');
		const safeFrontendUrl = JSON.stringify(process.env.FRONTEND_URL?.replace(/\/$/, ''));
		return `
			<!DOCTYPE html>
			<html>
				<head>
					<title>Authentication Failed</title>
				</head>
				<body>
					<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
						<h2>Authentication Failed</h2>
						<p>${this.escapeHtml(error)}</p>
					</div>
					<script>
						if (window.opener) {
							window.opener.postMessage({
								type: 'OAUTH_ERROR',
								error: ${safeErrorJson}
							}, ${safeFrontendUrl});
						}
						setTimeout(() => window.close(), 2000);
					</script>
				</body>
			</html>
		`;
	}
}