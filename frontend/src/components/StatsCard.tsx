import React from 'react';
import { Link2, BarChart3, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardsProps {
	data: {
		total: number;
		urls: Array<{
			clicks: number;
			isExpired: boolean;
			createdAt: string;
		}>;
	} | null;
}

interface StatCardProps {
	icon: React.ReactNode;
	label: string;
	value: number;
	iconBg: string;
	iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, iconBg, iconColor }) => (
	<Card>
		<CardContent className="p-6">
			<div className="flex items-center">
				<div className={`p-2 ${iconBg} rounded-lg`}>
					<div className={iconColor}>{icon}</div>
				</div>
				<div className="ml-4">
					<p className="text-sm font-medium text-muted-foreground">{label}</p>
					<p className="text-2xl font-bold">{value.toLocaleString()}</p>
				</div>
			</div>
		</CardContent>
	</Card>
);

export const StatsCards: React.FC<StatsCardsProps> = ({ data }) => {
	const totalClicks = data?.urls.reduce((sum, url) => sum + url.clicks, 0) || 0;
	const activeUrls = data?.urls.filter(url => !url.isExpired).length || 0;
	const thisMonthUrls = data?.urls.filter(url => {
		const urlDate = new Date(url.createdAt);
		const now = new Date();
		return urlDate.getMonth() === now.getMonth() && urlDate.getFullYear() === now.getFullYear();
	}).length || 0;

	const stats = [
		{
			icon: <Link2 className="h-6 w-6" />,
			label: "Total URLs",
			value: data?.total || 0,
			iconBg: "bg-blue-100 dark:bg-blue-900/20",
			iconColor: "text-blue-600 dark:text-blue-400",
		},
		{
			icon: <BarChart3 className="h-6 w-6" />,
			label: "Total Clicks",
			value: totalClicks,
			iconBg: "bg-green-100 dark:bg-green-900/20",
			iconColor: "text-green-600 dark:text-green-400",
		},
		{
			icon: <Activity className="h-6 w-6" />,
			label: "Active URLs",
			value: activeUrls,
			iconBg: "bg-purple-100 dark:bg-purple-900/20",
			iconColor: "text-purple-600 dark:text-purple-400",
		},
		{
			icon: <TrendingUp className="h-6 w-6" />,
			label: "This Month",
			value: thisMonthUrls,
			iconBg: "bg-orange-100 dark:bg-orange-900/20",
			iconColor: "text-orange-600 dark:text-orange-400",
		},
	];

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{stats.map((stat, index) => (
				<StatCard key={index} {...stat} />
			))}
		</div>
	);
};