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
}

export const apiService = new ApiService();