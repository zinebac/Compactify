import type { DashboardQuery } from "@/types";
import { authService } from "./auth";

class ApiService {

	private auth_service = authService;

	async createUrl(originalUrl: string, uid?: string, expiresAt?: string) {
		const endpoint = uid ? '/url/create' : '/url/create-anonymous';
		const requestBody: any = { originalUrl };
		if (uid) requestBody.uid = uid;
		if (expiresAt && expiresAt.trim() !== '') requestBody.expiresAt = expiresAt;
		return this.auth_service.makeAuthenticatedRequest(endpoint, {
			method: 'POST',
			body: JSON.stringify(requestBody),
		});
	}

	// dashboard methods

	async getDashboardData(query: DashboardQuery): Promise<any> {
		const params = new URLSearchParams();
		Object.entries(query).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				params.append(key, String(value));
			}
		})
		const endpoint = `/url/dashboard?${params}`;
		return this.auth_service.makeAuthenticatedRequest(endpoint, {
			method: 'GET',
		});
	}

	async deleteUrl(shortCode: string): Promise<any> {
		if (!shortCode || shortCode.trim() === '') {
			throw new Error('Short code is required to delete a URL');
		}
		const endpoint = `/url/delete/${shortCode}`;
		return this.auth_service.makeAuthenticatedRequest(endpoint, {
			method: 'DELETE',
		});
	}

	async deleteAllUrls(): Promise<any> {
		return this.auth_service.makeAuthenticatedRequest(`/url/delete-all`, {
			method: 'DELETE',
		});
	}

	async extendUrl(shortCode: string, expiresAt: string): Promise<any> {
		return this.auth_service.makeAuthenticatedRequest(`/url/extend/${shortCode}`, {
			method: 'PUT',
			body: JSON.stringify({ expiresAt }),
		});
	}

	async regenerateUrl(urlId: string): Promise<any> {
		const endpoint = `/url/regenerate/${urlId}`;
		return this.auth_service.makeAuthenticatedRequest(endpoint, {
			method: 'PUT',
		});
	}

}


export const apiService = new ApiService();
