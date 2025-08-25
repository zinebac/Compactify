export class UrlResponseDto {
	originalUrl: string;
	shortenedUrl: string;
	expiresAt?: string | null;
	createdAt?: string;
}
	
export class DashboardUrlDto {
	id: string;
	originalUrl: string;
	shortenedUrl: string;
	clicks: number;
	expiresAt?: string | null;
	createdAt: string;
	}
	
export class DashboardResponseDto {
	urls: DashboardUrlDto[];
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