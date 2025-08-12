import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '@/services/auth';
import { tokenManager } from '@/services/token';
import { authenticateWithPopup } from '@/utils/popup-auth';

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (provider: 'google' | 'github') => Promise<void>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		checkAuth();
	}, []);

	const checkAuth = async () => {
		try {
			const authData = await authService.refreshToken();
			setUser(authData?.user || null);
		} catch (error) {
			setUser(null);
			tokenManager.clearToken();
		} finally {
			setIsLoading(false);
		}
	};

	const login = async (provider: 'google' | 'github') => {
		try {
			setIsLoading(true);
			
			const authUrl = provider === 'google' 
				? authService.getGoogleAuthUrl() 
				: authService.getGithubAuthUrl();
			
			const authData = await authenticateWithPopup(authUrl, provider);
			
			tokenManager.setToken(authData.accessToken);
			setUser(authData.user);
			
		} catch (error) {
			console.error(`${provider} login failed:`, error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const logout = async () => {
		try {
			await authService.logout();
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			setUser(null);
			tokenManager.clearToken();
		}
	};

	return (
		<AuthContext.Provider value={{
			user,
			isAuthenticated: !!user,
			isLoading,
			login,
			logout,
		}}>
			{children}
		</AuthContext.Provider>
	);
};