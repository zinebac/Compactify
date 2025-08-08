import type { AuthResponse } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiService {

	async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'An error occurred');
		}
		return response.json() as Promise<T>;
	}

	async createUrlAnonymous(originalUrl: string): Promise<{ shortenedUrl: string; shortCode: string }> {
		const response = await fetch(`${API_BASE_URL}/url/create-anonymous`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({ originalUrl }),
		});

		return this.handleResponse<{ shortenedUrl: string; shortCode: string }>(response);
	}

	// Auth methods

	async refreshToken(): Promise<AuthResponse> {
		console.log('🔄 Attempting token refresh...');

		const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
			method: 'GET',
			credentials: 'include',
		});

		const data = await response.json();

		if (data.success) {
			localStorage.setItem('accessToken', data.data.accessToken);
			return {
				accessToken: data.data.accessToken,
				user: data.data.user
			};
		} else {
			localStorage.removeItem('accessToken');
			console.error('Token refresh failed:', data.message);
			throw new Error(data.message || 'Token refresh failed');
		}
	}

	// Auth URLs for OAuth (used for popup authentication)
	getGoogleAuthUrl(): string {
		return `${API_BASE_URL}/auth/google`;
	}

	getGithubAuthUrl(): string {
		return `${API_BASE_URL}/auth/github`;
	}

	async logout(): Promise<void> {
		try {
			const response = await fetch(`${API_BASE_URL}/auth/logout`, {
				method: 'GET',
				credentials: 'include',
			});

			const data = await response.json();
			console.log('Logout:', data.message);
		} finally {
			localStorage.removeItem('accessToken');
		}
	}
}

export const apiService = new ApiService();