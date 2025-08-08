import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, ArrowRight, CheckCircle, Link2, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useCreateUrl } from '@/hooks/useUrl';
import Nav from '@/components/Nav';

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
	const { createUrl, isLoading, error, clearError } = useCreateUrl();
	const [err, setErr] = useState<string | null>(null);
	const [originalUrl, setOriginalUrl] = useState('');
	const [shortenedUrl, setShortenedUrl] = useState('');
	const [copied, setCopied] = useState(false);
	const { isAuthenticated, user, logout } = useAuth();

	const handleUrlChange = (url: string) => {
	setOriginalUrl(url);
	setShortenedUrl('');
	setCopied(false);
	};

	const shortenUrl = async () => {
		const result = await createUrl(originalUrl);
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
											<p className="text-sm text-green-700 mb-2 font-medium">
												Your shortened URL:
											</p>
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
											</div>
										</CardContent>
									</Card>
								</motion.div>
							)}

							{/* Status Message */}
							<div className="text-center text-sm text-gray-500">
								Sign in to track your URLs and access advanced features.
							</div>
							</CardContent>
						</Card>
					</motion.div>
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