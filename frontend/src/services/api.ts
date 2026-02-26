import type { DashboardQuery, CreateUrlRequest, DashboardData, ApiError, URLData } from "@/types";
import { authService } from "./auth";

/** Minimal shape of a newly created/regenerated URL returned by the backend. */
interface UrlMutationResponse {
	id: string;
	shortenedUrl: string;
	expiresAt: string | null;
}

/**
 * Application-level API client.
 *
 * Wraps every backend endpoint with typed request/response shapes and
 * consistent error handling. All network traffic flows through
 * {@link authService.makeAuthenticatedRequest} so that token management
 * (refresh, retry) is handled transparently.
 */
class ApiService {
	private auth_service = authService;

	/**
	 * Creates a shortened URL.
	 *
	 * Routes to the authenticated endpoint when `isAuthenticated` is true,
	 * otherwise uses the anonymous endpoint (no token required).
	 *
	 * @param originalUrl     - The long URL to shorten.
	 * @param isAuthenticated - Whether the current user is signed in.
	 * @param expiresAt       - Optional ISO 8601 expiry datetime string.
	 * @returns The API response containing the new `shortenedUrl`.
	 */
	async createUrl(
		originalUrl: string,
		isAuthenticated?: boolean,
		expiresAt?: string,
	): Promise<UrlMutationResponse> {
		const endpoint = isAuthenticated ? '/url/create' : '/url/create-anonymous';
		const requestBody: CreateUrlRequest = { originalUrl };

		if (expiresAt && expiresAt.trim() !== '') {
			requestBody.expiresAt = expiresAt;
		}

		try {
			return await this.auth_service.makeAuthenticatedRequest<UrlMutationResponse>(endpoint, {
				method: 'POST',
				body: JSON.stringify(requestBody),
			});
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	/**
	 * Fetches paginated, filtered, and sorted URL data for the dashboard.
	 *
	 * @param query - Pagination, sort, filter, and search parameters.
	 * @returns Transformed {@link DashboardData} ready for rendering.
	 */
	async getDashboardData(query: DashboardQuery): Promise<DashboardData> {
		const params = new URLSearchParams();

		if (query.page)      params.append('page',      String(query.page));
		if (query.limit)     params.append('limit',     String(query.limit));
		if (query.sortBy)    params.append('sortBy',    query.sortBy);
		if (query.sortOrder) params.append('sortOrder', query.sortOrder);
		if (query.filter)    params.append('filter',    query.filter);
		if (query.search)    params.append('search',    query.search);

		const endpoint = `/url/dashboard?${params}`;

		try {
			const response = await this.auth_service.makeAuthenticatedRequest<unknown>(endpoint, {
				method: 'GET',
			});

			return this.transformDashboardResponse(response);
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	/**
	 * Transforms the raw backend dashboard payload into the shape expected by
	 * the UI. Attaches a computed `isExpired` getter to each URL entry so
	 * components do not need to re-implement the expiry check.
	 *
	 * @param backendResponse - Raw JSON from `GET /url/dashboard`.
	 * @returns Normalised {@link DashboardData}.
	 */
	private transformDashboardResponse(backendResponse: unknown): DashboardData {
		const res = backendResponse as {
			urls: URLData[];
			pagination: DashboardData['pagination'];
			stats: DashboardData['stats'];
		};

		return {
			urls: res.urls.map((url) => ({
				...url,
				get isExpired() {
					return url.expiresAt ? new Date() > new Date(url.expiresAt) : false;
				},
			})),
			pagination: {
				currentPage: res.pagination.currentPage,
				totalPages:  res.pagination.totalPages,
				totalUrls:   res.pagination.totalUrls,
				limit:        res.pagination.limit,
			},
			stats: {
				totalClicks: res.stats.totalClicks,
			},
		};
	}

	/**
	 * Deletes a single URL by its ID.
	 *
	 * @param urlId - The UUID of the URL record to delete.
	 * @throws {Error} When `urlId` is blank.
	 */
	async deleteUrl(urlId: string): Promise<unknown> {
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

	/**
	 * Deletes all URLs belonging to the authenticated user.
	 */
	async deleteAllUrls(): Promise<unknown> {
		try {
			return await this.auth_service.makeAuthenticatedRequest(`/url/delete-all`, {
				method: 'DELETE',
			});
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	/**
	 * Extends the expiry of an existing URL.
	 *
	 * @param urlId     - The UUID of the URL to extend.
	 * @param expiresAt - New ISO 8601 expiry datetime string.
	 * @returns Updated URL data including the new `expiresAt` value.
	 */
	async extendUrl(urlId: string, expiresAt: string): Promise<UrlMutationResponse> {
		try {
			return await this.auth_service.makeAuthenticatedRequest<UrlMutationResponse>(
				`/url/extend/${urlId}`,
				{
					method: 'PUT',
					body: JSON.stringify({ expiresAt }),
				},
			);
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	/**
	 * Regenerates the short code for an existing URL, invalidating the old link.
	 *
	 * @param urlId - The UUID of the URL whose short code should be regenerated.
	 * @returns Updated URL data including the new `shortenedUrl`.
	 */
	async regenerateUrl(urlId: string): Promise<UrlMutationResponse> {
		try {
			return await this.auth_service.makeAuthenticatedRequest<UrlMutationResponse>(
				`/url/regenerate/${urlId}`,
				{
					method: 'PUT',
				},
			);
		} catch (error) {
			throw this.handleApiError(error);
		}
	}

	/**
	 * Normalises any thrown value into a structured {@link ApiError}.
	 *
	 * Maps known backend error messages to friendlier copy so the UI never
	 * exposes raw server messages directly.
	 *
	 * @param error - The caught value (ideally an `Error` instance).
	 * @returns A structured `ApiError` with `message` and `statusCode`.
	 */
	private handleApiError(error: unknown): ApiError {
		const err = error as { statusCode?: number; message?: string };

		if (err.statusCode === 429) {
			return { message: 'Too many requests. Please wait a moment and try again.', statusCode: 429 };
		}

		if (err.message) {
			if (err.message.includes('URL limit exceeded')) {
				return { message: 'You have reached your URL limit. Please delete some URLs to create new ones.', statusCode: 400 };
			}
			if (err.message.includes('Invalid URL')) {
				return { message: 'Please enter a valid URL starting with http:// or https://', statusCode: 400 };
			}
			if (err.message.includes('User not authenticated')) {
				return { message: 'Please sign in to continue', statusCode: 401 };
			}
			return { message: err.message, statusCode: err.statusCode };
		}

		return { message: 'An unexpected error occurred. Please try again.', statusCode: 500 };
	}
}

export const apiService = new ApiService();
