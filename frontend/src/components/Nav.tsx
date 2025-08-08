import type React from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
	BarChart3, 
	Link2, 
	User2,
	LogOut,
	Settings,
	HelpCircle,
	ChevronDown,
	Menu,
	X,
	Loader2
} from 'lucide-react';
import type { User } from '@/types';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavProps {
	isAuthenticated: boolean;
	user: User | null;
	handleLogout: () => Promise<void>;
}

const Nav: React.FC<NavProps> = ({
	isAuthenticated,
	user,
	handleLogout
}) => {
	const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isLoggingOut, setIsLoggingOut] = useState(false);
	const navigate = useNavigate();

	const getUserInitials = (name?: string) => {
		if (!name) return 'U';
		return name
			.split(' ')
			.map(word => word[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	const getUserAvatar = () => {
		return undefined; // No avatar URL for now
	};

	const handleLogoutClick = async () => {
		try {
			setIsLoggingOut(true);
			await handleLogout();
		} catch (error) {
			console.error('Logout failed:', error);
		} finally {
			setIsLoggingOut(false);
		}
	};

	const closeMenu = () => setIsMobileMenuOpen(false);

	const menuItems = [
		{ icon: BarChart3, label: 'Dashboard', path: '/dashboard' },
		{ icon: Settings, label: 'Profile & Settings', path: '/profile' },
		{ icon: HelpCircle, label: 'Help & Support', path: '/help' },
	];

	return (
		<nav className="border-b bg-white/50 backdrop-blur-sm sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<div 
						className="flex items-center space-x-3 cursor-pointer"
						onClick={() => navigate('/')}
					>
						<div className="h-10 w-10 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
							<Link2 size={20} className="text-white" />
						</div>
						<div>
							<h1 className="text-xl font-bold text-gray-900">Compactify</h1>
							<p className="text-xs text-gray-500">Fast & Secure</p>
						</div>
					</div>

					{/* Menu */}
					<div className="flex items-center space-x-3">
						{isAuthenticated ? (
							<>
								{/* Desktop Menu */}
								<div className="hidden md:flex items-center space-x-3">
									{/* User Dropdown Menu */}
									<DropdownMenu open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
										<DropdownMenuTrigger asChild>
											<Button 
												variant="ghost" 
												className="gap-2 h-9 px-3 hover:bg-gray-100 transition-colors focus:outline-none"
											>
												<Avatar className="h-6 w-6">
													<AvatarImage src={getUserAvatar()} />
													<AvatarFallback className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
														{getUserInitials(user?.name)}
													</AvatarFallback>
												</Avatar>
												<span className="font-medium text-gray-700 max-w-32 truncate">
													{user?.name || 'User'}
												</span>
												<ChevronDown 
													size={14} 
													className={`text-gray-500 transition-transform duration-200 ${
														isUserMenuOpen ? 'rotate-180' : 'rotate-0'
													}`} 
												/>
											</Button>
										</DropdownMenuTrigger>

										<DropdownMenuContent 
											align="end" 
											className="w-56 mt-2 border shadow-lg bg-white/95 backdrop-blur-sm focus:outline-none"
										>
											<DropdownMenuLabel className="font-normal">
												<div className="flex flex-col space-y-1">
													<p className="text-sm font-medium text-gray-900">{user?.name}</p>
													<p className="text-xs text-gray-500 truncate">{user?.email}</p>
													<Badge variant="outline" className="w-fit text-xs">
														{user?.provider}
													</Badge>
												</div>
											</DropdownMenuLabel>
											
											<DropdownMenuSeparator />
											
											<DropdownMenuItem 
												onClick={() => navigate('/dashboard')}
												className="gap-2 cursor-pointer hover:bg-blue-50"
											>
												<BarChart3 size={16} />
												Dashboard
											</DropdownMenuItem>
											
											<DropdownMenuItem 
												onClick={() => navigate('/help')}
												className="gap-2 cursor-pointer hover:bg-gray-50"
											>
												<HelpCircle size={16} />
												Help & Support
											</DropdownMenuItem>
											
											<DropdownMenuSeparator />
											
											<DropdownMenuItem 
												onClick={handleLogoutClick}
												disabled={isLoggingOut}
												className="gap-2 cursor-pointer hover:bg-red-50 text-red-600 focus:text-red-600"
											>
												{isLoggingOut ? (
													<Loader2 size={16} className="animate-spin" />
												) : (
													<LogOut size={16} />
												)}
												{isLoggingOut ? 'Signing out...' : 'Sign out'}
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>

								{/* Mobile Menu */}
								<div className="md:hidden relative">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
										className="h-9 w-9 p-0"
									>
										{isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
									</Button>

									{/* Mobile Dropdown */}
									{isMobileMenuOpen && (
										<div className="absolute top-12 right-0 w-64 bg-white rounded-lg shadow-lg border p-4 z-50">
											{/* User Info */}
											<div className="flex items-center space-x-3 pb-3 border-b">
												<Avatar className="h-8 w-8">
													<AvatarImage src={getUserAvatar()} />
													<AvatarFallback className="text-xs bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700">
														{getUserInitials(user?.name)}
													</AvatarFallback>
												</Avatar>
												<div className="flex-1 min-w-0">
													<p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
													<p className="text-xs text-gray-500 truncate">{user?.email}</p>
													<Badge variant="outline" className="w-fit text-xs mt-1">
														{user?.provider}
													</Badge>
												</div>
											</div>

											{/* Menu Items */}
											<div className="space-y-1 py-2">
												{menuItems.map((item) => (
													<Button 
														key={item.path}
														onClick={() => {
															navigate(item.path);
															closeMenu();
														}}
														variant="ghost"
														className="w-full justify-start gap-2 h-8"
													>
														<item.icon size={16} />
														{item.label}
													</Button>
												))}
											</div>

											{/* Logout */}
											<div className="pt-2 border-t">
												<Button 
													onClick={handleLogoutClick}
													disabled={isLoggingOut}
													variant="ghost"
													className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 h-8"
												>
													{isLoggingOut ? (
														<Loader2 size={16} className="animate-spin" />
													) : (
														<LogOut size={16} />
													)}
													{isLoggingOut ? 'Signing out...' : 'Sign out'}
												</Button>
											</div>
										</div>
									)}

									{/* Mobile Menu Backdrop */}
									{isMobileMenuOpen && (
										<div 
											className="fixed inset-0 bg-black/20 z-40"
											onClick={closeMenu}
										/>
									)}
								</div>
							</>
						) : (
							/* Sign In Button */
							<Button 
								onClick={() => navigate('/auth')} 
								size="sm"
								className="gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-sm"
							>
								<User2 size={16} />
								Sign In
							</Button>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};

export default Nav;