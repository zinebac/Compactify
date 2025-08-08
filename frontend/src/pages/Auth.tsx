import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
	ArrowLeft, 
	Shield,
	CheckCircle, 
	AlertCircle, 
	Github, 
	Lock,
	Link2,
	BarChart3,
	Calendar,
	Globe
} from 'lucide-react';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

export const Auth: React.FC = () => {
	const { login, isLoading } = useAuth();
	const [error, setError] = useState<string | null>(null);
	const [authStep, setAuthStep] = useState<'idle' | 'authenticating' | 'success'>('idle');
	const [dots, setDots] = useState('');
	const navigate = useNavigate();

	// Animated dots for loading
	useEffect(() => {
		if (isLoading) {
			const interval = setInterval(() => {
				setDots(prev => prev.length >= 3 ? '' : prev + '.');
			}, 500);
			return () => clearInterval(interval);
		} else {
			setDots('');
		}
	}, [isLoading]);

	const handleLogin = async (provider: 'google' | 'github') => {
		try {
			setError(null);
			setAuthStep('authenticating');
			// console.log(`Starting ${provider} login...`);
			
			await login(provider);
			
			setAuthStep('success');
			// console.log('Login successful');
			
			// Add delay for success animation
			setTimeout(() => {
				navigate('/Home');
			}, 1500);
			
		} catch (error) {
			// console.error(`${provider} login failed:`, error);
			setError(error instanceof Error ? error.message : 'Login failed');
			setAuthStep('idle');
		}
	};

	const features = [
		{ 
			icon: BarChart3, 
			title: 'Advanced Analytics', 
			desc: 'Track clicks, locations, and user engagement',
			color: 'bg-blue-100 text-blue-600'
		},
		{ 
			icon: Calendar, 
			title: 'Smart Management', 
			desc: 'Set expiry dates and extend URL lifetimes',
			color: 'bg-purple-100 text-purple-600'
		},
		{ 
			icon: Globe, 
			title: 'Custom Domains', 
			desc: 'Use your own branded short domains',
			color: 'bg-green-100 text-green-600'
		}
	];

	const stats = [
		{ number: '10K+', label: 'Active Users', color: 'text-blue-600' },
		{ number: '500K+', label: 'URLs Created', color: 'text-purple-600' },
		{ number: '99.9%', label: 'Uptime', color: 'text-green-600' }
	];

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
			{/* Header */}
			<header className="border-b bg-white/50 backdrop-blur-sm">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex justify-between items-center h-16">
						<div 
							className="flex items-center space-x-3 cursor-pointer"
							onClick={() => navigate('/')}
						>
							<div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
								<Link2 size={20} className="text-white" />
							</div>
							<div>
								<h1 className="text-xl font-bold text-gray-900">Compactify</h1>
								<p className="text-xs text-gray-500">Authentication</p>
							</div>
						</div>

						<Button
							variant="ghost"
							onClick={() => navigate('/')}
							className="gap-2"
						>
							<ArrowLeft size={16} />
							Back to Home
						</Button>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
				<div className="w-full max-w-6xl">
					<div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

						<div className="order-2 lg:order-1 hidden lg:block">
							<Card className="border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
								<CardContent className="p-6">
									<div className="text-center mb-6">
										<div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
											<Shield className="w-10 h-10 text-white" />
										</div>
										
										<h3 className="text-xl font-bold text-gray-900 mb-2">
											Unlock Powerful Features
										</h3>
										<p className="text-gray-600 text-sm">
											Join thousands of users who trust our platform
										</p>
									</div>

									{/* Feature List */}
									<div className="space-y-4 mb-6">
										{features.map((feature) => (
											<div key={feature.title} className="flex items-center space-x-3">
												<div className={`w-10 h-10 ${feature.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
													<feature.icon className="w-5 h-5" />
												</div>
												<div className="min-w-0">
													<h4 className="font-medium text-gray-900 text-sm">{feature.title}</h4>
													<p className="text-xs text-gray-600">{feature.desc}</p>
												</div>
											</div>
										))}
									</div>

									<Separator className="my-4" />

									{/* Stats */}
									<div className="grid grid-cols-3 gap-3 text-center">
										{stats.map((stat) => (
											<div key={stat.label}>
												<div className={`text-lg font-bold ${stat.color}`}>
													{stat.number}
												</div>
												<div className="text-xs text-gray-600 font-medium">
													{stat.label}
												</div>
											</div>
										))}
									</div>

									{/* Trust Badge */}
									<div className="flex justify-center mt-4">
										<Badge variant="secondary" className="gap-1 text-xs">
											<Shield size={10} />
											Trusted & Secure
										</Badge>
									</div>
								</CardContent>
							</Card>
						</div>

						<div className="order-1 lg:order-2">
							<Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm">
								<CardHeader className="text-center pb-6">
									<div className="w-16 h-16 bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
										<Shield className="w-8 h-8 text-blue-600" />
									</div>
									
									<CardTitle className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
										Welcome Back
									</CardTitle>
									<CardDescription className="text-base text-gray-600">
										Sign in to access your dashboard and manage your shortened URLs
									</CardDescription>
								</CardHeader>

								<CardContent className="space-y-6">
									<AnimatePresence mode="wait">
										{authStep === 'success' ? (
											<motion.div
												key="success"
												initial={{ opacity: 0, scale: 0.9 }}
												animate={{ opacity: 1, scale: 1 }}
												className="text-center py-6"
											>
												<div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
													<CheckCircle className="w-8 h-8 text-green-600" />
												</div>
												<h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Successful!</h3>
												<p className="text-gray-600">Redirecting to your dashboard...</p>
											</motion.div>
										) : (
											<div key="buttons" className="space-y-4">
												{/* Google Login */}
												<Button
													onClick={() => handleLogin('google')}
													disabled={isLoading}
													variant="outline"
													size="lg"
													className="w-full h-12 text-base font-medium hover:bg-gray-50"
												>
													<div className="flex items-center space-x-3">
														{isLoading && authStep === 'authenticating' ? (
															<div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
														) : (
															<svg className="w-5 h-5" viewBox="0 0 24 24">
																<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
																<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
																<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
																<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
															</svg>
														)}
														<span>Continue with Google</span>
													</div>
												</Button>

												{/* GitHub Login */}
												<Button
													onClick={() => handleLogin('github')}
													disabled={isLoading}
													size="lg"
													className="w-full h-12 text-base font-medium bg-gray-900 hover:bg-gray-800"
												>
													<div className="flex items-center space-x-3">
														{isLoading && authStep === 'authenticating' ? (
															<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
														) : (
															<Github className="w-5 h-5" />
														)}
														<span>Continue with GitHub</span>
													</div>
												</Button>
											</div>
										)}
									</AnimatePresence>

									{/* Loading State */}
									<AnimatePresence>
										{isLoading && authStep === 'authenticating' && (
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
												className="text-center py-3"
											>
												<div className="text-blue-600 font-medium mb-1">
													Opening authentication window{dots}
												</div>
												<p className="text-sm text-gray-500">
													Please allow popups for this site if prompted
												</p>
											</motion.div>
										)}
									</AnimatePresence>

									{/* Error Message */}
									<AnimatePresence>
										{error && (
											<motion.div
												initial={{ opacity: 0 }}
												animate={{ opacity: 1 }}
												exit={{ opacity: 0 }}
											>
												<Alert variant="destructive">
													<AlertCircle className="h-4 w-4" />
													<AlertDescription>
														<strong>Authentication Failed:</strong> {error}
													</AlertDescription>
												</Alert>
											</motion.div>
										)}
									</AnimatePresence>

									<Separator />

									{/* Security Notice */}
									<Card className="bg-blue-50 border-blue-200">
										<CardContent className="pt-4">
											<div className="flex items-start space-x-3">
												<Lock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
												<div>
													<h4 className="text-blue-900 font-medium text-sm">Secure Authentication</h4>
													<p className="text-blue-700 text-xs mt-1">
														We use OAuth 2.0 for secure authentication. Your credentials are never stored on our servers.
													</p>
												</div>
											</div>
										</CardContent>
									</Card>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t bg-white/50 backdrop-blur-sm py-4 px-4 text-center text-gray-500 text-sm">
				<p>© 2025 Compactify. Secure, fast, and reliable URL shortening service.</p>
			</footer>
		</div>
	);
};