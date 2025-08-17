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

export interface URLData {
	id: string;
	originalUrl: string;
	shortenedUrl: string;
	clicks: number;
	createdAt: string;
	expiresAt: string | null;
	isExpired: boolean;
}

export interface DashboardData {
	currentPage: number;
	urls: URLData[];
	totalClicks: number;
	totalUrls: number;
	page: number;
	limit: number;
	totalPages: number;
}

export interface DashboardStats {
	totalUrls: number;
	totalClicks: number;
	activeUrls: number;
}