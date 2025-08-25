import type { DashboardQuery, CreateUrlRequest, DashboardData, ApiError } from "@/types";
import { authService } from "./auth";

class ApiService {
	private auth_service = authService;

	async createUrl(originalUrl: string, uid?: string, expiresAt?: string): Promise<any> {
		const endpoint = uid ? '/url/create' : '/url/create-anonymous';
		const requestBody: CreateUrlRequest = { originalUrl };
		
		if (uid) requestBody.uid = uid;
		if (expiresAt && expiresAt.trim() !== '') {
			requestBody.expiresAt = expiresAt;
		}

		try {
			return await this.auth_service.makeAuthenticatedRequest(endpoint, {
				method: 'POST',
				body: JSON.stringify(requestBody),
			});
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	async getDashboardData(query: DashboardQuery): Promise<any> {
		const params = new URLSearchParams();
		
		// Map frontend query to backend expected params
		if (query.page) params.append('page', String(query.page));
		if (query.limit) params.append('limit', String(query.limit));
		if (query.sort) params.append('sort', query.sort); // Backend expects 'sort'
		if (query.order) params.append('order', query.order); // Backend expects 'order'
		if (query.filter) params.append('filter', query.filter);
		if (query.search) params.append('search', query.search);

		const endpoint = `/url/dashboard?${params}`;
		
		try {
			const response = await this.auth_service.makeAuthenticatedRequest(endpoint, {
				method: 'GET',
			});

			return this.transformDashboardResponse(response);
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	private transformDashboardResponse(backendResponse: any): DashboardData {
		return {
			urls: backendResponse.urls.map((url: any) => ({
				...url,
				get isExpired() {
					return url.expiresAt ? new Date() > new Date(url.expiresAt) : false;
				}
			})),
			pagination: {
				currentPage: backendResponse.currentPage,
				totalPages: backendResponse.totalPages,
				totalUrls: backendResponse.totalUrls,
				limit: backendResponse.limit,
			},
			stats: {
				totalClicks: backendResponse.totalClicks,
			},
		};
	}

	async deleteUrl(urlId: string): Promise<any> {
		if (!urlId || urlId.trim() === '') {
			throw new Error('URL ID is required to delete a URL');
		}
		
		try {
			return await this.auth_service.makeAuthenticatedRequest(`/url/delete/${urlId}`, {
				method: 'DELETE',
			});
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	async deleteAllUrls(): Promise<any> {
		try {
			return await this.auth_service.makeAuthenticatedRequest(`/url/delete-all`, {
				method: 'DELETE',
			});
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	async extendUrl(urlId: string, expiresAt: string): Promise<any> {
		try {
			return await this.auth_service.makeAuthenticatedRequest(`/url/extend/${urlId}`, {
				method: 'PUT',
				body: JSON.stringify({ expiresAt }),
			});
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	async regenerateUrl(urlId: string): Promise<any> {
		try {
			return await this.auth_service.makeAuthenticatedRequest(`/url/regenerate/${urlId}`, {
				method: 'PUT',
			});
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	private handleApiError(error: any): ApiError {
		if (error.message) {
			// Extract meaningful error messages
			if (error.message.includes('URL limit exceeded')) {
				return { message: 'You have reached your URL limit. Please delete some URLs to create new ones.', statusCode: 400 };
			}
			if (error.message.includes('Invalid URL')) {
				return { message: 'Please enter a valid URL starting with http:// or https://', statusCode: 400 };
			}
			if (error.message.includes('User not authenticated')) {
				return { message: 'Please sign in to continue', statusCode: 401 };
			}
			return { message: error.message, statusCode: error.statusCode };
		}
		return { message: 'An unexpected error occurred. Please try again.', statusCode: 500 };
	}
}

export const apiService = new ApiService();