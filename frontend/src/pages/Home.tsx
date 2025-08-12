import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ArrowRight, CheckCircle, Link2, Shield, AlertCircle, BarChart3, Calendar as Cal, User, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

import { useCreateUrl } from '@/hooks/useUrl';
import Nav from '@/components/Nav';
import { Calendar } from '@/components/Calendar';

// Animation variants
const fadeIn = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
	hidden: { opacity: 0 },
	visible: {
	opacity: 1,
	transition: {
		staggerChildren: 0.1
	}
	}
};

export default function Home() {
	
	const [err, setErr] = useState<string | null>(null);
	const [originalUrl, setOriginalUrl] = useState('');
	const [shortenedUrl, setShortenedUrl] = useState('');
	const [copied, setCopied] = useState(false);
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [expiresAt, setExpiresAt] = React.useState<string>('');
	
	const { createUrl, isLoading, error, clearError } = useCreateUrl();
	const { isAuthenticated, user, logout } = useAuth();
	const navigate = useNavigate();

	const handleUrlChange = (url: string) => {
	setOriginalUrl(url);
	setShortenedUrl('');
	setCopied(false);
	};

	const shortenUrl = async () => {
		const result: any = await createUrl(originalUrl, user?.id, expiresAt);
		if (result) {
			setShortenedUrl(result.shortenedUrl);
			clearError();
		} else {
			setShortenedUrl('');
			if (error) {
				setErr(error);
			}
		}
	};

	const copyToClipboard = () => {
		navigator.clipboard.writeText(shortenedUrl);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleLogout = async () => {
		logout().then(() => {
			setOriginalUrl('');
			setShortenedUrl('');
			setCopied(false);
			setErr(null);
		});
	}

	return (
		<div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">

			<Nav isAuthenticated={isAuthenticated} user={user} handleLogout={handleLogout} />

			<main className="flex-grow">
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
					<motion.div 
						initial="hidden"
						animate="visible"
						variants={staggerContainer}
						className="text-center mb-12"
					>
						<motion.div variants={fadeIn} className="mb-6">
							<Badge variant="secondary" className="mb-4">
								<Shield size={12} className="mr-1" />
									Trusted by 10K+ Users
								</Badge>
								<h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
									Shorten URLs
									<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
										{' '}Instantly
									</span>
								</h1>
								<p className="text-xl text-gray-600 max-w-2xl mx-auto">
									Transform long, complex URLs into short, shareable links. Track clicks, 
									set expiration dates, and manage everything from one dashboard.
								</p>
						</motion.div>
					</motion.div>

					{/* URL Shortener Card */}
					<motion.div variants={fadeIn}>
						<Card className="max-w-2xl mx-auto shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
							<CardHeader className="text-center pb-6">
								<CardTitle className="text-2xl">Create Short Link</CardTitle>
								<CardDescription>
									Paste your long URL below to create a shortened version
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">

							<div className="space-y-2">
								<Label htmlFor="url" className="text-sm font-medium">
									Enter your long URL
								</Label>
								<Input
									id="url"
									type="url"
									value={originalUrl}
									onChange={(e) => handleUrlChange(e.target.value)}
									placeholder="https://example.com/very/long/url/that/needs/shortening"
									className="h-12 text-base"
								/>

								{err && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
									>
										<Alert variant="destructive">
										<AlertCircle className="h-4 w-4" />
										<AlertDescription>{error}</AlertDescription>
										</Alert>
									</motion.div>
								)}

								{isAuthenticated && (
									<Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
										<CollapsibleTrigger asChild>
											<Button 
												variant="ghost" 
												size="sm" 
												className={`
													gap-2 w-full h-11 px-4 rounded-lg border border-dashed transition-all duration-200
													${showAdvanced 
														? 'border-blue-300 bg-blue-50/50 text-blue-700 hover:bg-blue-50' 
														: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
													}
												`}
											>
												<Settings 
													size={16} 
													className={`transition-transform duration-200 ${showAdvanced ? 'rotate-90' : ''}`} 
												/>
												<span className="font-medium">Advanced Options</span>
												<svg
													className={`ml-auto w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
													fill="none"
													viewBox="0 0 24 24"
													stroke="currentColor"
												>
													<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
												</svg>
											</Button>
										</CollapsibleTrigger>
										
										<CollapsibleContent>
											<motion.div
												initial={{ opacity: 0, y: -10 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.2, ease: "easeOut" }}
												className="mt-3 overflow-hidden"
											>
												<div className="p-5 border border-gray-200 rounded-lg bg-gradient-to-br from-white to-gray-50/50 shadow-sm">
													{/* Header */}
													<div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
														<div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
															<Cal size={16} className="text-blue-600" />
														</div>
														<div>
															<h4 className="font-medium text-gray-900 text-sm">URL Expiration</h4>
															<p className="text-xs text-gray-500">Set when this link should expire</p>
														</div>
													</div>

													{/* Content */}
													<div className="space-y-3">

														{/* Info Cards */}
														<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
															<div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
																<div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center mt-0.5">
																	<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
																		<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
																	</svg>
																</div>
																<div>
																	<p className="text-xs font-medium text-green-800">Permanent URLs</p>
																	<p className="text-xs text-green-600">Leave empty for links that never expire</p>
																</div>
															</div>

															<div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
																<div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center mt-0.5">
																	<svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
																		<path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
																	</svg>
																</div>
																<div>
																	<p className="text-xs font-medium text-amber-800">Auto-Cleanup</p>
																	<p className="text-xs text-amber-600">Expired links are automatically removed</p>
																</div>
															</div>
														</div>

														<div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
															{/* Expiration Date & Time */}
															<div>
																<Label 
																	htmlFor="expiry" 
																	className="text-sm font-medium text-gray-700 mb-2 block"
																>
																	Expiration Date & Time
																</Label>
																<div className="relative">
																	<Calendar 
																		setExpiresAt={setExpiresAt} 
																		expiresAt={expiresAt}
																	/>
																</div>
															</div>

															{/* Quick Actions */}
															{!expiresAt && (
																<div>
																	<Label 
																		htmlFor="expiry" 
																		className="text-sm font-medium text-gray-700 mb-2 block"
																	>
																		Quick Actions
																	</Label>
																	<div className="flex flex-wrap gap-2 pt-2">
																		<button
																			type="button"
																			onClick={() => {
																				const date = new Date();
																				date.setDate(date.getDate() + 7);
																				setExpiresAt(date.toISOString().slice(0, 16));
																			}}
																			className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
																		>
																			+ 7 days
																		</button>
																		<button
																			type="button"
																			onClick={() => {
																				const date = new Date();
																				date.setMonth(date.getMonth() + 1);
																				setExpiresAt(date.toISOString().slice(0, 16));
																			}}
																			className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
																		>
																			+ 1 month
																		</button>
																		<button
																			type="button"
																			onClick={() => {
																				const date = new Date();
																				date.setFullYear(date.getFullYear() + 1);
																				setExpiresAt(date.toISOString().slice(0, 16));
																			}}
																			className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
																		>
																			+ 1 year
																		</button>
																	</div>																
																</div>

															)}															
														</div>



														{/* Clear Button */}
														{expiresAt && (
															<button
																type="button"
																onClick={() => setExpiresAt('')}
																className="text-xs text-gray-500 hover:text-red-600 transition-colors flex items-center gap-1"
															>
																<svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
																	<path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
																</svg>
																Clear expiration date
															</button>
														)}
													</div>
												</div>
											</motion.div>
										</CollapsibleContent>
									</Collapsible>
								)}
							</div>

							{/* Shorten Button */}
							<Button
								onClick={shortenUrl}
								disabled={isLoading || !originalUrl}
								size="lg"
								className="w-full h-12 text-base font-medium"
							>
							{isLoading ? (
								<>
									<div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2" />
									Processing...
								</>
							) : (
								<>
									<ArrowRight size={18} className="mr-2" />
									Shorten URL
								</>
							)}
							</Button>

							{/* Result */}
							{shortenedUrl && (
								<motion.div
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
								>
									<Card className="border-green-200 bg-green-50">
										<CardContent className="pt-4">
											<div className='flex items-center justify-between mb-4'>
												<p className="text-sm text-green-700 mb-2 font-medium">
													Your shortened URL:
												</p>

												<p className="text-xs text-green-700">
													✓ URL saved to your account.{' '}
												</p>									
											</div>

											<div className="flex items-center space-x-2">
												<Input
													value={shortenedUrl}
													readOnly
													className="bg-white border-green-300 text-blue-600 font-medium"
												/>
												<Button
													onClick={copyToClipboard}
													variant={copied ? "default" : "outline"}
													size="sm"
													className="gap-2 min-w-[100px]"
												>
													{copied ? (
														<>
															<CheckCircle size={16} />
															Copied!
														</>
													) : (
														<>
															<Copy size={16} />
															Copy
														</>
													)}
												</Button>

												{isAuthenticated && (
													<>
														<Button 
															variant="link" 
															size="sm"
															onClick={() => navigate('/dashboard')}
															className="p-0 h-auto text-green-700 underline cursor-pointer hover:text-green-800"
														>
															View in dashboard
														</Button>
													</>
												)}
											</div>
										</CardContent>
									</Card>
								</motion.div>
							)}

							{/* Status Message */}
							<div className="text-center text-sm text-gray-500">
								{isAuthenticated 
									? "Your URLs are saved and tracked in your dashboard."
									: "Sign in to track your URLs and access advanced features."
								}
							</div>
							</CardContent>
						</Card>
					</motion.div>

					{!isAuthenticated && (
						<motion.div
							initial={{ opacity: 0, y: 40 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: 0.3 }}
							className="mt-16"
						>
							<Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
								<CardContent className="pt-8">
								<div className="text-center mb-8">
									<h3 className="text-2xl font-bold text-gray-900 mb-2">
										Unlock Premium Features
									</h3>
									<p className="text-gray-600">
										Sign up for free to access powerful URL management tools
									</p>
								</div>
								
								<div className="grid md:grid-cols-2 gap-6 mb-8">
									<div className="text-center">
										<div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
											<BarChart3 size={32} className="text-blue-600" />
										</div>
									<h4 className="font-semibold text-gray-900 mb-2">Analytics & Tracking</h4>
									<p className="text-sm text-gray-600">
										Monitor click statistics, geographic data, and engagement metrics
									</p>
									</div>
									<div className="text-center">
										<div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
											<Cal size={32} className="text-purple-600" />
										</div>
									<h4 className="font-semibold text-gray-900 mb-2">Custom Expiry & Management</h4>
										<p className="text-sm text-gray-600">
											Set expiration dates, organize URLs, and extend lifetimes
										</p>
									</div>
								</div>
								
								<div className="text-center">
									<Button
										onClick={() => navigate('/auth')}
										size="lg"
										className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-800"
									>
										<User size={18} />
										Sign Up for Free
									</Button>
								</div>
								</CardContent>
							</Card>
						</motion.div>
					)}
				</div>
			</main>

			{/* Footer */}
			<footer className="bg-gray-900 text-white">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<div className="flex flex-col md:flex-row justify-between items-center">
						<div className="mb-8 md:mb-0">
							<div className="flex items-center justify-center md:justify-start mb-4">
								<div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mr-3">
									<Link2 size={20} className="text-white" />
								</div>
								<span className="font-bold text-xl">Compactify</span>
							</div>
							<p className="text-gray-400 text-center md:text-left">
								© 2025 Compactify. All rights reserved.
							</p>
						</div>
						<div className="flex flex-wrap justify-center gap-8">
							<Button variant="link" className="text-gray-300 hover:text-white p-0">
								Privacy Policy
							</Button>
							<Button variant="link" className="text-gray-300 hover:text-white p-0">
								Terms of Service
							</Button>
							<Button variant="link" className="text-gray-300 hover:text-white p-0">
								Help Center
							</Button>
							<Button variant="link" className="text-gray-300 hover:text-white p-0">
								Contact Us
							</Button>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
};