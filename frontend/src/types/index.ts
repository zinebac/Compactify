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
}

export interface AuthResponse {
	accessToken: string;
	user: User;
}

export interface DashboardQuery {
	page?: number;
	limit?: number;
	sortBy?: 'createdAt' | 'expiresAt' | 'clickCount';
	sortOrder?: 'asc' | 'desc';
	filter?: 'all' | 'expired' | 'active';
	search?: string;
}

export interface URLData {
	id: string;
	originalUrl: string;
	shortenedUrl: string;
	clicks: number;
	createdAt: string;
	expiresAt: string | null;
	get isExpired(): boolean;
}

export interface DashboardData {
	urls: URLData[];
	pagination: {
		currentPage: number;
		totalPages: number;
		totalUrls: number;
		limit: number;
	};
	stats: {
		totalClicks: number;
	};
}

export interface DashboardStats {
	totalUrls: number;
	totalClicks: number;
	activeUrls: number;
	maxUrls?: number;
}

export interface ApiError {
	message: string;
	statusCode?: number;
}