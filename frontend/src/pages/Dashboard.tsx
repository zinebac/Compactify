import React, { useState, useEffect } from 'react';
import type { DashboardQuery } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { useAuth } from '@/contexts/AuthContext';
import Nav from '@/components/Nav';
import { StatsCards } from '@/components/StatsCard';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const Dashboard: React.FC = () => {
	const navigate = useNavigate();
	const [data, setData] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { isAuthenticated, user, logout } = useAuth();
	const [query, setQuery] = useState<DashboardQuery>({
		page: 1,
		limit: 10,
		sort: 'createdAt',
		order: 'desc',
		filter: 'all'
	});

	useEffect(() => {

		async function fetchDashboard(query: DashboardQuery) {
			try {
				setIsLoading(true);
				const response = await apiService.getDashboardData(query);
				if (response) {
					setData(response);
				} else {
					setData(null);
					setError('No data found for the given query.');
				}
				console.log('Dashboard data fetched:', response);
				setIsLoading(false);
			} catch (error) {
				console.error('Error fetching dashboard:', error);
				setIsLoading(false);
				setError('Failed to fetch dashboard data.');
				// Handle error (e.g., show alert)
			}
		}

		fetchDashboard(query);
	}, [query]);

	const handleLogout = async () => {
		logout().then(() => {
			navigate('/');
		});
	}

	if (isLoading && !data) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
				<div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">			
			
			<Nav isAuthenticated={isAuthenticated} user={user} handleLogout={handleLogout} />

			<main className="container mx-auto px-4 py-8 space-y-8">
				<motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <StatsCards data={data} />
        </motion.div>
			</main>
		</div>
	);
};