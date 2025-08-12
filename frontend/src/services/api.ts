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
}


export const apiService = new ApiService();
