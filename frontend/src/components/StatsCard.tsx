import React from 'react';
import { 
	BarChart3, 
	TrendingUp,
	Link2,
	Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardsProps {
	user: any;
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  maxUrls?: number;
}

interface ActivityStatus {
	clicksPerUrl: string;
	activePercentage: string;
	usagePercentage: string;
	status: 'Excellent' | 'Good' | 'Needs Attention';
}

export const StatsCards: React.FC<StatsCardsProps> = ({ 
  totalUrls,
  totalClicks,
  activeUrls,
  maxUrls = 50,
}) => {

  const getActivityStatus = (): ActivityStatus => {
    const clicksPerUrl = totalUrls > 0 ? (totalClicks / totalUrls).toFixed(1) : '0';
    const activePercentage = totalUrls > 0 ? ((activeUrls / totalUrls) * 100).toFixed(0) : '0';
    const usagePercentage = maxUrls > 0 ? Math.round((totalUrls / maxUrls) * 100) : 0;
    
    let status: ActivityStatus['status'];
    if (usagePercentage >= 100) {
      status = 'Needs Attention';
    } else if (usagePercentage >= 80) {
      status = 'Good';
    } else {
      status = 'Excellent';
    }
    
    return {
      clicksPerUrl,
      activePercentage,
      usagePercentage: usagePercentage.toString(),
      status
    };
  };

  const activity = getActivityStatus();

	return (
		<div className="flex flex-col lg:flex-row gap-6 p-6 justify-center items-center">
			<Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-blue-200 shadow-md hover:shadow-lg transition-shadow duration-300">
				<CardContent className="p-8">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
					<div className="flex items-center gap-4 group">
						<div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
							<Link2 size={24} className="text-blue-600" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-600 mb-1">Total URLs</p>
							<p className="text-3xl font-bold text-gray-900 tracking-tight">
							{totalUrls.toLocaleString()}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4 group">
						<div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
							<TrendingUp size={24} className="text-green-600" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-600 mb-1">Total Clicks</p>
							<p className="text-3xl font-bold text-gray-900 tracking-tight">
							{totalClicks.toLocaleString()}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4 group">
						<div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
							<BarChart3 size={24} className="text-purple-600" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-600 mb-1">Avg. Clicks/URL</p>
							<p className="text-3xl font-bold text-gray-900 tracking-tight">
							{activity.clicksPerUrl}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-4 group">
						<div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
							<Users size={24} className="text-orange-600" />
						</div>
						<div>
							<p className="text-sm font-medium text-gray-600 mb-1">Account Status</p>
							<div className="flex items-center gap-2">
								<Badge 
									variant={
										activity.status === 'Excellent' ? 'default' : 
										activity.status === 'Good' ? 'secondary' : 
										'destructive'
									}
									className={`text-xs font-medium px-2 py-1 ${
										activity.status === 'Excellent' 
											? 'bg-green-100 text-green-800 border-green-200' 
											: activity.status === 'Good' 
											? 'bg-blue-100 text-blue-800 border-blue-200' 
											: 'bg-red-100 text-red-800 border-red-200'
									}`}
								>
									{activity.status}
								</Badge>
								<span className="text-sm text-gray-500 font-medium">
									({activity.activePercentage}% active)
								</span>
							</div>
						</div>
					</div>
				</div>
				</CardContent>
			</Card>
		</div>
	);
};