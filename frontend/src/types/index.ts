export interface CreateUrlRequest {
	originalUrl: string;
	expiresAt?: string;
}

export interface User {
	id: string;
	email: string;
	name: string;
	provider: 'GOOGLE' | 'GITHUB';
	providerId: string;
	createdAt: string;
	updatedAt: string;
}

export interface AuthResponse {
	accessToken: string;
	user: User;
}

export interface DashboardQuery {
	page?: number;
	limit?: number;
	sort?: 'createdAt' | 'expiresAt' | 'clickCount';
	order?: 'asc' | 'desc';
	filter?: 'all' | 'expired' | 'active';
	search?: string;
}