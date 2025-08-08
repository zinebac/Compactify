import { useState, useCallback } from 'react';
import { apiService } from '../services/api';

export const useCreateUrl = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const createUrl = useCallback(async (originalUrl: string, expiresAt?: string) => {
		setIsLoading(true);
		setError(null);

		// Validate URL format
		const validUrl = () => {
			try {
				if (!originalUrl || !originalUrl.trim()) {
					return false;
				}
				const url = new URL(originalUrl);

				return url.protocol === 'http:' || url.protocol === 'https:';
			} catch (e) {
				return false;
			}
		}

		try {
			if (!validUrl()) {
				throw new Error('Invalid URL');
			}
			return await apiService.createUrlAnonymous(originalUrl);
		} catch (err) {
			let errorMessage = 'Failed to create short URL';

			if (err instanceof Error) {
				// Handle specific error messages + add more later
				if (err.message.includes('Invalid URL')) {
					errorMessage = 'Please enter a valid URL.';
				} else {
					errorMessage = "An error occured please try again later.";
				}
			}

			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const clearError = useCallback(() => {
		setError(null);
	}, []);

	return { createUrl, isLoading, error, clearError };
};