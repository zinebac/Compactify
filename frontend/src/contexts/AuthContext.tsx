// contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react'
import type { User, AuthResponse } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (provider: 'google' | 'github') => Promise<void>;
	logout: () => Promise<void>;
	refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const isAuthenticated = !!user;

	useEffect(() => {
		if (isLoading) {
			checkAuth();
		}
	}, []);

	const checkAuth = async () => {

		try {
			console.log('🔍 Checking authentication status...');
			
			const token = localStorage.getItem('accessToken');
			if (token) {
				console.log('📱 Found access token, refreshing...');
				const authData = await apiService.refreshToken();
				setUser(authData.user);
			} else {
				throw new Error('No access token found');
			}
		} catch (error) {
			localStorage.removeItem('accessToken');
			console.error('Authentication check failed:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (provider: 'google' | 'github') => {

		try {
			setIsLoading(true);

			// Use popup authentication
			const authData = await authenticateWithPopup(provider);
			
			// Set user data
			setUser(authData.user);
			
		} catch (error) {
			console.error(`${provider} login failed:`, error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};
	
	const authenticateWithPopup = (provider: 'google' | 'github'): Promise<AuthResponse> => {
		return new Promise((resolve, reject) => {
			const authUrl = provider === 'google' 
				? apiService.getGoogleAuthUrl() 
				: apiService.getGithubAuthUrl();
	
			// Open popup window
			const popup = window.open(
				authUrl, 
				`${provider}_auth`,
				'width=600,height=700,scrollbars=yes,resizable=yes,status=1,location=1'
			);
	
			if (!popup) {
				reject(new Error('Popup blocked. Please allow popups for this site.'));
				return;
			}

			// Listen for messages from popup
			const messageListener = (event: MessageEvent) => {
	
				// Check origin for security (allow both http and https localhost)
				const allowedOrigins = [
					window.location.origin,
					'http://localhost:5173',
					'http://localhost:3000',
					'https://localhost:5173',
					'https://localhost:3000'
				];
	
				if (!allowedOrigins.includes(event.origin)) {
					return;
				}
	
				if (event.data.type === 'OAUTH_SUCCESS') {
					window.removeEventListener('message', messageListener);
					clearInterval(checkClosed);
					
					if (!popup.closed) {
						popup.close();
					}
					
					// Store access token and resolve
					localStorage.setItem('accessToken', event.data.accessToken);
					resolve({
						accessToken: event.data.accessToken,
						user: event.data.user
					});
					
				} else if (event.data.type === 'OAUTH_ERROR') {					
					window.removeEventListener('message', messageListener);
					clearInterval(checkClosed);
					
					if (!popup.closed) {
						popup.close();
					}
					
					reject(new Error(event.data.error || 'Authentication failed'));
				} else {
					console.log('Unknown message type:', event.data.type);
				}
			};
	
			// Listen for messages from popup
			window.addEventListener('message', messageListener);

			// Check if popup is closed manually
			const checkClosed = setInterval(() => {
				if (popup.closed) {
					clearInterval(checkClosed);
					window.removeEventListener('message', messageListener);
					reject(new Error('Authentication cancelled'));
				}
			}, 1000);
	
			// Timeout after 5 minutes
			setTimeout(() => {
				clearInterval(checkClosed);
				window.removeEventListener('message', messageListener);
				if (!popup.closed) {
					popup.close();
				}
				reject(new Error('Authentication timeout'));
			}, 300000);
		});
	};

	const logout = async () => {
		try {
			console.log('🚪 Logging out...');
			await apiService.logout();
		} catch (error) {
			console.error('❌ Logout error:', error);
		} finally {
			setUser(null);
			localStorage.removeItem('accessToken');
		}
	};

	const refreshToken = async () => {
		try {
			console.log('🔄 Refreshing token...');
			const authData = await apiService.refreshToken();
			setUser(authData.user);
			console.log('✅ Token refresh successful');
		} catch (error) {
			console.error('❌ Token refresh failed:', error);
			setUser(null);
			localStorage.removeItem('accessToken');
			throw error;
		}
	};

	const value: AuthContextType = {
		user,
		isAuthenticated,
		isLoading: isLoading,
		login,
		logout,
		refreshToken,
	};

	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	);
};