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

	@Get('status')
	async getAuthStatus(@Req() req, @Res() res: Response) {
	try {
		const refreshToken = req.cookies?.refresh_token;
		
		if (!refreshToken) {
		return res.json({
			success: true,
			data: { isAuthenticated: false, user: null }
		});
		}

		const user = await this.authService.validateRefreshToken(refreshToken);
		
		if (!user) {
		this.clearRefreshCookie(res);
		return res.json({
			success: true,
			data: { isAuthenticated: false, user: null }
		});
		}

		return res.json({
		success: true,
		data: {
			isAuthenticated: true,
			user: {
			id: user.id,
			email: user.email,
			name: user.name,
			provider: user.provider,
			createdAt: user.createdAt,
			}
		}
		});

	} catch (error) {
		return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
		success: false,
		message: 'Failed to check auth status'
		});
	}
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
			secure: true,
			sameSite: 'lax',
			path: '/',
			maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		});
	}

	private clearRefreshCookie(res: Response) {
		res.clearCookie('refresh_token');
	}

	private generateSuccessHTML(authData: any): string {
		return `
			<!DOCTYPE html>
			<html>
				<head>
					<title>Authentication Successful</title>
				</head>
				<body>
					<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
						<h2>✅ Authentication Successful!</h2>
						<p>Closing window...</p>
					</div>
					<script>
						if (window.opener) {
							window.opener.postMessage({
							type: 'OAUTH_SUCCESS',
							accessToken: '${authData.accessToken}',
							user: ${JSON.stringify(authData.user)}
							}, '${process.env.FRONTEND_URL}');
						}
						setTimeout(() => window.close(), 1000);
					</script>
				</body>
			</html>
		`;
	}

	private generateErrorHTML(error: string): string {
	return `
		<!DOCTYPE html>
		<html>
			<head>
				<title>Authentication Failed</title>
			</head>
			<body>
				<div style="text-align: center; padding: 50px; font-family: Arial, sans-serif;">
					<h2>❌ Authentication Failed</h2>
					<p>${error}</p>
				</div>
				<script>
					if (window.opener) {
						window.opener.postMessage({
						type: 'OAUTH_ERROR',
						error: '${error}'
						}, '${process.env.FRONTEND_URL}');
					}
					setTimeout(() => window.close(), 2000);
				</script>
			</body>
		</html>
	`;
	}
}