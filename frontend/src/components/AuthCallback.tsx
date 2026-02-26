import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Intermediate landing page for both OAuth callback routes
 * (`/auth/google/callback` and `/auth/github/callback`).
 *
 * The AuthProvider's `checkAuth` call runs on mount; this component waits
 * for it to finish (`isLoading === false`) before deciding where to redirect.
 * Acting before `isLoading` clears would falsely treat an in-progress auth
 * as a failure and bounce the user back to the login page.
 *
 * Uses `useNavigate` (client-side navigation) rather than
 * `window.location.href` to avoid a full-page reload and state reset.
 */
const AuthCallback: React.FC = () => {
	const { isAuthenticated, isLoading } = useAuth();
	const navigate = useNavigate();

	useEffect(() => {
		// Wait until the auth provider has finished resolving the session
		if (isLoading) return;

		const timer = setTimeout(() => {
			if (isAuthenticated) {
				navigate('/dashboard', { replace: true });
			} else {
				navigate('/auth?error=auth_failed', { replace: true });
			}
		}, 500);

		return () => clearTimeout(timer);
	}, [isAuthenticated, isLoading, navigate]);

	// Always show the spinner — this page should be on-screen only briefly
	return (
		<div className="min-h-screen bg-white flex items-center justify-center">
			<div className="text-center">
				<div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
				<p className="text-gray-600">Completing authentication...</p>
			</div>
		</div>
	);
};

export default AuthCallback;
