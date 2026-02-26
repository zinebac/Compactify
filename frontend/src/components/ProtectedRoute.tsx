import React from 'react';
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { isAuthenticated, isLoading } = useAuth();
	
	if (isLoading) {
		return (
		<div className="min-h-screen bg-white flex items-center justify-center">
			<div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
		</div>
		);
	}
	
	return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;