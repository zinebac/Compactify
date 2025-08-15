import { tokenManager } from "./token";

export const API_BASE_URL = import.meta.env.VITE_API_URL;

interface AuthResponse {
	accessToken: string;
	user: any;
}

class AuthService {
	private token_manager = tokenManager;
	
	async makeAuthenticatedRequest<T>(
		url: string, 
		options: RequestInit = {}
	): Promise<T> {
		// Auto-refresh if needed
		if (this.token_manager.shouldRefresh()) {
			await this.refreshToken();
		}

		const token = this.token_manager.getToken();
		
		const response = await fetch(`${API_BASE_URL}${url}`, {
			...options,
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...(token && { 'Authorization': `Bearer ${token}` }),
				...options.headers,
			},
		});

		// if 401, try refresh once and retry
		if (response.status === 401) {
			const refreshed = await this.refreshToken();
			if (refreshed) {
				const newToken = this.token_manager.getToken();
				if (newToken) {
					// Retry with new token
					return fetch(`${API_BASE_URL}${url}`, {
						...options,
						credentials: 'include',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${newToken}`,
							...options.headers,
						},
					}).then(res => this.handleResponse<T>(res));
				}
			}
			throw new Error('Authentication required');
		}

		return this.handleResponse<T>(response);
	}
	
	async refreshToken(): Promise<AuthResponse | null> {
		try {
			const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
				method: 'GET',
				credentials: 'include',
			});

			const data = await response.json();

			if (data.success && data.data.accessToken) {
				this.token_manager.setToken(data.data.accessToken);
				return {
					accessToken: data.data.accessToken,
					user: data.data.user
				};
			}

			this.token_manager.clearToken();
			return null;
		} catch (error) {
			this.token_manager.clearToken();
			return null;
		}
	}
	
	async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			throw new Error(errorData.message || `HTTP ${response.status}`);
		}
		return response.json();
	}

	async logout(): Promise<void> {
		try {
			await fetch(`${API_BASE_URL}/auth/logout`, {
				method: 'GET',
				credentials: 'include',
			});
		} finally {
			this.token_manager.clearToken();
		}
	}
	
	getGoogleAuthUrl(): string {
		return `${API_BASE_URL}/auth/google`;
	}
	
	getGithubAuthUrl(): string {
		return `${API_BASE_URL}/auth/github`;
	}
}

export const authService = new AuthService();