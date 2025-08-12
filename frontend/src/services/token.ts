class TokenManager {
	private static instance: TokenManager;
	private accessToken: string | null = null;
	private tokenExpiry: number | null = null;
	
	static getInstance(): TokenManager {
		if (!TokenManager.instance) {
			TokenManager.instance = new TokenManager();
		}
		return TokenManager.instance;
	}
	
	setToken(token: string, expiresIn: number = 3600): void {
		this.accessToken = token;
		// Expire 1 minute early for safety
		this.tokenExpiry = Date.now() + ((expiresIn - 60) * 1000);
	}
	
	getToken(): string | null {
		if (this.isExpired()) {
			this.clearToken();
			return null;
		}
		return this.accessToken;
	}
	
	clearToken(): void {
		this.accessToken = null;
		this.tokenExpiry = null;
	}
	
	isExpired(): boolean {
		return this.tokenExpiry ? Date.now() >= this.tokenExpiry : false;
	}
	
	shouldRefresh(): boolean {
		// Refresh 2 minutes before expiry
		return this.tokenExpiry ? Date.now() >= (this.tokenExpiry - 120000) : false;
	}
}

export const tokenManager = TokenManager.getInstance();