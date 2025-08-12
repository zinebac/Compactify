interface AuthResponse {
	accessToken: string;
	user: any;
}

export const authenticateWithPopup = (authUrl: string, provider: string): Promise<AuthResponse> => {
	return new Promise((resolve, reject) => {
		const popup = window.open(
			authUrl,
			`${provider}_auth`,
			'width=600,height=700,scrollbars=yes,resizable=yes'
		);

		if (!popup) {
			reject(new Error('Popup blocked. Please allow popups.'));
			return;
		}

		const cleanup = () => {
			window.removeEventListener('message', messageListener);
			clearInterval(checkClosed);
			if (!popup.closed) popup.close();
		};

		const messageListener = (event: MessageEvent) => {
			// Security: Check origin
			const allowedOrigins = [
				window.location.origin,
				'http://localhost:5173',
				'http://localhost:3000'
			];

			if (!allowedOrigins.includes(event.origin)) return;

			if (event.data.type === 'OAUTH_SUCCESS') {
				cleanup();
				resolve({
					accessToken: event.data.accessToken,
					user: event.data.user
				});
			} else if (event.data.type === 'OAUTH_ERROR') {
				cleanup();
				reject(new Error(event.data.error || 'Authentication failed'));
			}
		};

		window.addEventListener('message', messageListener);

		// Check if popup closed manually
		const checkClosed = setInterval(() => {
			if (popup.closed) {
				cleanup();
				reject(new Error('Authentication cancelled'));
			}
		}, 1000);

		// Timeout after 5 minutes
		setTimeout(() => {
			cleanup();
			reject(new Error('Authentication timeout'));
		}, 300000);
	});
};