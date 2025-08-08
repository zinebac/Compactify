// services/api.ts

const API_BASE_URL = import.meta.env.VITE_API_URL;

class ApiService {

	async handleResponse<T>(response: Response): Promise<T> {
		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.message || 'An error occurred');
		}
		return response.json() as Promise<T>;
	}

	async createUrlAnonymous(originalUrl: string): Promise<{ shortenedUrl: string; shortCode: string }> {
		const response = await fetch(`${API_BASE_URL}/url/create-anonymous`, {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({ originalUrl }),
		});

		return this.handleResponse<{ shortenedUrl: string; shortCode: string }>(response);
	}
}



export const apiService = new ApiService();