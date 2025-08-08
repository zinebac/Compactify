import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const AuthCallback: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();
	
	useEffect(() => {
		// This component handles the OAuth callback
	
		const timer = setTimeout(() => {
			if (isAuthenticated) {
				window.location.href = '/Home';
			} else {
				window.location.href = '/auth?error=auth_failed';
			}
		}, 2000);
	
		return () => clearTimeout(timer);
	}, [isAuthenticated]);
	
	if (isLoading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
						<p className="text-gray-600">Completing authentication...</p>
					</div>
			</div>
		);
	}
	
	return null;
};

export default AuthCallback;