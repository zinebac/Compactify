import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Link2,
  Users,
  Activity,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface StatsCardsProps {
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  maxUrls?: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalUrls,
  totalClicks,
  activeUrls,
  maxUrls = 50,
}) => {
  const clicksPerUrl = totalUrls > 0 ? (totalClicks / totalUrls).toFixed(1) : '0';
  const activePercentage = totalUrls > 0 ? ((activeUrls / totalUrls) * 100).toFixed(0) : '0';
  const usagePercentage = maxUrls > 0 ? Math.min(Math.round((totalUrls / maxUrls) * 100), 100) : 0;

  const status: 'Excellent' | 'Good' | 'Needs Attention' =
    usagePercentage >= 100 ? 'Needs Attention' :
    usagePercentage >= 80  ? 'Good' :
    'Excellent';

  const usageColor =
    usagePercentage >= 100 ? { border: 'border-red-200',    icon: 'bg-red-100',    text: 'text-red-600',    bar: '[&>div]:bg-red-500'    } :
    usagePercentage >= 80  ? { border: 'border-yellow-200', icon: 'bg-yellow-100', text: 'text-yellow-600', bar: '[&>div]:bg-yellow-500' } :
                             { border: 'border-orange-100', icon: 'bg-orange-100', text: 'text-orange-500', bar: '[&>div]:bg-orange-500' };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 px-6">

      {/* Total URLs */}
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 group">
            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm">
              <Link2 size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total URLs</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {totalUrls.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total Clicks */}
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-green-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 group">
            <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm">
              <TrendingUp size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Clicks</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {totalClicks.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Avg. Clicks / URL */}
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-purple-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 group">
            <div className="h-12 w-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm">
              <BarChart3 size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avg. Clicks / URL</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {clicksPerUrl}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL Usage */}
      <Card className={`shadow-md hover:shadow-lg transition-shadow duration-300 ${usageColor.border}`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4 group mb-3">
            <div className={`h-12 w-12 rounded-xl ${usageColor.icon} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm`}>
              <Activity size={24} className={usageColor.text} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">URL Usage</p>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">
                {totalUrls}
                <span className="text-lg text-gray-500 font-medium"> / {maxUrls}</span>
              </p>
            </div>
          </div>
          <Progress value={usagePercentage} className={`h-2 ${usageColor.bar}`} />
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-gray-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 group">
            <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-200 shadow-sm">
              <Users size={24} className="text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Account Status</p>
              <Badge
                className={`text-xs font-medium px-2 py-1 ${
                  status === 'Excellent'
                    ? 'bg-green-100 text-green-800 border-green-200'
                    : status === 'Good'
                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                    : 'bg-red-100 text-red-800 border-red-200'
                }`}
              >
                {status}
              </Badge>
              <p className="text-sm text-gray-500 font-medium mt-1">
                {activePercentage}% active
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
