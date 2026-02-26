/**
 * In-memory JWT access-token store.
 *
 * Keeps the token purely in JavaScript heap memory (not `localStorage` or
 * `sessionStorage`) so it is never readable from other browser tabs and is
 * automatically discarded on page reload.  The HttpOnly refresh-token cookie
 * handled server-side remains the durable credential.
 *
 * Use the singleton {@link tokenManager} export rather than instantiating
 * this class directly.
 */
class TokenManager {
	private static instance: TokenManager;
	private accessToken: string | null = null;
	private tokenExpiry: number | null = null;

	/** Returns the single shared instance (creates it on first call). */
	static getInstance(): TokenManager {
		if (!TokenManager.instance) {
			TokenManager.instance = new TokenManager();
		}
		return TokenManager.instance;
	}

	/**
	 * Stores the access token and calculates its expiry timestamp.
	 *
	 * The stored expiry is set 60 seconds before the actual server-side expiry
	 * so that {@link shouldRefresh} can obtain a new token before the server
	 * starts rejecting requests.
	 *
	 * @param token     - Raw JWT access token string.
	 * @param expiresIn - Lifetime in seconds (defaults to 3 600 = 1 hour).
	 */
	setToken(token: string, expiresIn: number = 3600): void {
		this.accessToken = token;
		// Expire 1 minute early to avoid races at the boundary
		this.tokenExpiry = Date.now() + ((expiresIn - 60) * 1000);
	}

	/**
	 * Returns the stored token, or `null` if it has expired or was never set.
	 * Expired tokens are cleared automatically before returning.
	 */
	getToken(): string | null {
		if (this.isExpired()) {
			this.clearToken();
			return null;
		}
		return this.accessToken;
	}

	/** Removes the stored token and expiry timestamp. */
	clearToken(): void {
		this.accessToken = null;
		this.tokenExpiry = null;
	}

	/** Returns `true` when the token has passed its expiry timestamp. */
	isExpired(): boolean {
		return this.tokenExpiry ? Date.now() >= this.tokenExpiry : false;
	}

	/**
	 * Returns `true` when the token will expire within the next 2 minutes,
	 * giving the auth layer time to proactively refresh it before the server
	 * starts rejecting requests.
	 */
	shouldRefresh(): boolean {
		return this.tokenExpiry ? Date.now() >= (this.tokenExpiry - 120_000) : false;
	}
}

export const tokenManager = TokenManager.getInstance();
