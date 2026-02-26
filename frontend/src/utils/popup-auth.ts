import type { AuthResponse } from "../types";

/**
 * Opens an OAuth provider URL in a popup window and waits for the backend to
 * post an `OAUTH_SUCCESS` or `OAUTH_ERROR` message back via `window.postMessage`.
 *
 * Security: only messages whose `origin` matches the current page's origin or
 * the configured API origin (`VITE_API_URL`) are accepted; all others are
 * silently ignored to prevent cross-origin message injection.
 *
 * @param authUrl  - Full OAuth redirect URL (e.g. `https://api.example.com/auth/google`).
 * @param provider - Label used as the popup window name (e.g. `"google"`).
 * @returns A promise that resolves with the {@link AuthResponse} on success.
 * @throws {Error} If the popup is blocked, authentication is cancelled, or times out.
 */
export const authenticateWithPopup = (authUrl: string, provider: string): Promise<AuthResponse> => {
	return new Promise((resolve, reject) => {
		const popup = window.open(
			authUrl,
			`${provider}_auth`,
			'width=600,height=700,scrollbars=yes,resizable=yes',
		);

		if (!popup) {
			reject(new Error('Popup blocked. Please allow popups.'));
			return;
		}

		// Declared before cleanup so cleanup can reference it regardless of
		// which exit path (success, error, manual close, timeout) fires first.
		let authTimeoutId: ReturnType<typeof setTimeout> | null = null;

		/**
		 * Tears down all listeners and timers unconditionally.
		 * Must be called by every exit path to prevent memory leaks and
		 * late-firing timers that could double-settle the promise.
		 */
		const cleanup = () => {
			window.removeEventListener('message', messageListener);
			clearInterval(checkClosed);
			if (authTimeoutId) clearTimeout(authTimeoutId);
			if (!popup.closed) popup.close();
		};

		const messageListener = (event: MessageEvent) => {
			// Accept messages from the current page origin and the API origin only.
			// VITE_API_URL is used instead of hardcoding localhost ports so this
			// works correctly in production and staging environments.
			const allowedOrigins = [
				window.location.origin,
				import.meta.env.VITE_API_URL as string,
			].filter(Boolean);

			if (!allowedOrigins.includes(event.origin)) return;

			if (event.data.type === 'OAUTH_SUCCESS') {
				cleanup();
				resolve({
					accessToken: event.data.accessToken,
					user: event.data.user,
				});
			} else if (event.data.type === 'OAUTH_ERROR') {
				cleanup();
				reject(new Error(event.data.error || 'Authentication failed'));
			}
		};

		window.addEventListener('message', messageListener);

		// Poll for manual popup close — no postMessage is sent in that case
		const checkClosed = setInterval(() => {
			if (popup.closed) {
				cleanup();
				reject(new Error('Authentication cancelled'));
			}
		}, 1000);

		// Hard timeout after 5 minutes — ID stored so cleanup() can cancel it
		authTimeoutId = setTimeout(() => {
			cleanup();
			reject(new Error('Authentication timeout'));
		}, 300_000);
	});
};
