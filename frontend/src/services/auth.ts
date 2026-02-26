import type { User } from "../types";
import { tokenManager } from "./token";

/**
 * Backend base URL sourced from `VITE_API_URL`.
 * Throws at module-initialisation time (not silently at request time) when the
 * variable is absent, so the misconfiguration is caught immediately on startup
 * rather than producing cryptic `undefined/auth/...` fetch errors at runtime.
 */
export const API_BASE_URL: string = (() => {
	const url = import.meta.env.VITE_API_URL as string | undefined;
	if (!url) {
		throw new Error(
			'[Compactify] VITE_API_URL is not defined. ' +
			'Copy frontend/.env.example to frontend/.env and set the value.',
		);
	}
	return url;
})();

/** Shape returned by token-bearing auth endpoints. */
interface AuthResponse {
	accessToken: string;
	user: User;
}

/**
 * Low-level HTTP client that handles JWT attachment, proactive token refresh,
 * transparent 401 retry, and per-request timeouts.
 *
 * All API calls should go through {@link makeAuthenticatedRequest} so that
 * auth logic stays centralised and consistent.
 */
class AuthService {
	private token_manager = tokenManager;

	/** Maximum time (ms) to wait for a network response before aborting. */
	private static readonly REQUEST_TIMEOUT_MS = 15_000;

	/**
	 * Wraps `fetch` with an automatic abort after {@link REQUEST_TIMEOUT_MS}.
	 * Converts the browser's `AbortError` into a user-friendly timeout message.
	 *
	 * @param input - Fully-qualified URL string.
	 * @param init  - Standard `RequestInit` options (merged with the abort signal).
	 * @throws {Error} With message "Request timed out" when the deadline is exceeded.
	 */
	private async fetchWithTimeout(input: string, init?: RequestInit): Promise<Response> {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			AuthService.REQUEST_TIMEOUT_MS,
		);

		try {
			return await fetch(input, { ...init, signal: controller.signal });
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				throw new Error('Request timed out. Please try again.');
			}
			throw error;
		} finally {
			clearTimeout(timeoutId);
		}
	}

	/**
	 * Performs an authenticated HTTP request against the API.
	 *
	 * Workflow:
	 * 1. Proactively refreshes the access token when it is within 2 minutes of expiry.
	 * 2. Attaches the Bearer token (when present) to the `Authorization` header.
	 * 3. On a 401 response, attempts one token refresh then retries the original request.
	 * 4. Throws `Error('Authentication required')` when the retry also fails.
	 *
	 * @param url     - Path relative to `VITE_API_URL` (e.g. `/url/create`).
	 * @param options - Additional `RequestInit` options (method, body, headers…).
	 * @returns Parsed JSON response cast to `T`.
	 */
	async makeAuthenticatedRequest<T>(
		url: string,
		options: RequestInit = {},
	): Promise<T> {
		// Proactively refresh before the window expires
		if (this.token_manager.shouldRefresh()) {
			await this.refreshToken();
		}

		const token = this.token_manager.getToken();

		const response = await this.fetchWithTimeout(`${API_BASE_URL}${url}`, {
			...options,
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
				...(token && { Authorization: `Bearer ${token}` }),
				...options.headers,
			},
		});

		// On 401: attempt one token refresh then retry the original request
		if (response.status === 401) {
			const refreshed = await this.refreshToken();

			if (refreshed) {
				const newToken = this.token_manager.getToken();
				if (newToken) {
					// Network or timeout errors during retry propagate to the caller
					const retryResponse = await this.fetchWithTimeout(
						`${API_BASE_URL}${url}`,
						{
							...options,
							credentials: 'include',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${newToken}`,
								...options.headers,
							},
						},
					);
					return this.handleResponse<T>(retryResponse);
				}
			}

			throw new Error('Authentication required');
		}

		return this.handleResponse<T>(response);
	}

	/**
	 * Calls `/auth/refresh` to obtain a fresh access token via the HttpOnly
	 * refresh-token cookie stored by the browser.
	 *
	 * Clears the local token on any failure so the user is treated as signed-out.
	 *
	 * @returns A new {@link AuthResponse} on success, or `null` on failure.
	 */
	async refreshToken(): Promise<AuthResponse | null> {
		try {
			const response = await this.fetchWithTimeout(`${API_BASE_URL}/auth/refresh`, {
				method: 'GET',
				credentials: 'include',
			});

			const data = await response.json();

			if (data.success && data.data.accessToken) {
				this.token_manager.setToken(data.data.accessToken);
				return {
					accessToken: data.data.accessToken,
					user: data.data.user,
				};
			}

			this.token_manager.clearToken();
			return null;
		} catch {
			this.token_manager.clearToken();
			return null;
		}
	}

	/**
	 * Asserts that an HTTP response is successful and parses its JSON body.
	 *
	 * Maps well-known status codes to structured errors with an attached
	 * `statusCode` property so callers can branch on specific failures.
	 *
	 * @param response - The raw `Response` from `fetch`.
	 * @returns Parsed JSON cast to `T`.
	 * @throws {Error & { statusCode: number }} On any non-2xx status.
	 */
	async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			if (response.status === 429) {
				const err: Error & { statusCode?: number } = new Error(
					'Too many requests. Please slow down and try again.',
				);
				err.statusCode = 429;
				throw err;
			}

			const errorData = await response.json().catch(() => ({}));
			const err: Error & { statusCode?: number } = new Error(
				(errorData as { message?: string }).message || `HTTP ${response.status}`,
			);
			err.statusCode = response.status;
			throw err;
		}

		return response.json() as Promise<T>;
	}

	/**
	 * Signs the current user out by invalidating the server-side refresh-token
	 * cookie, then clears the in-memory access token regardless of the response.
	 */
	async logout(): Promise<void> {
		try {
			await this.fetchWithTimeout(`${API_BASE_URL}/auth/logout`, {
				method: 'GET',
				credentials: 'include',
			});
		} finally {
			this.token_manager.clearToken();
		}
	}

	/** @returns The OAuth redirect URL for Google sign-in. */
	getGoogleAuthUrl(): string {
		return `${API_BASE_URL}/auth/google`;
	}

	/** @returns The OAuth redirect URL for GitHub sign-in. */
	getGithubAuthUrl(): string {
		return `${API_BASE_URL}/auth/github`;
	}
}

export const authService = new AuthService();
