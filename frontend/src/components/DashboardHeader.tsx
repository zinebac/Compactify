import React from 'react';
import { 
  Plus, 
  Download, 
  BarChart3, 
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  user: any;
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  maxUrls?: number;
  isAtLimit?: boolean;
  onCreateNew: () => void;
  onExportData: () => void;
  onRefreshAll: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  totalUrls,
  maxUrls = 50,
  isAtLimit = false,
  onCreateNew,
  onExportData,
  onRefreshAll,
}) => {
  const getCurrentTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const usagePercentage = maxUrls > 0 ? (totalUrls / maxUrls) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-6">
        <div className="space-y-3 w-full">
          <div className="flex items-center gap-4 p-10">
            <div className="flex-1">
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                {getCurrentTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your links and track their performance
              </p>
              
              {/* ✅ URL Usage Indicator */}
              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">URL Usage</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isAtLimit ? 'text-red-600' : usagePercentage > 80 ? 'text-yellow-600' : 'text-gray-900'}`}>
                      {totalUrls} / {maxUrls}
                    </span>
                    {isAtLimit && <AlertTriangle size={16} className="text-red-500" />}
                  </div>
                </div>
                <Progress 
                  value={usagePercentage} 
                  className={`w-64 h-2 ${
                    isAtLimit ? 'bg-red-100' : 
                    usagePercentage > 80 ? 'bg-yellow-100' : 
                    'bg-gray-100'
                  }`}
                />
                {isAtLimit && (
                  <p className="text-xs text-red-600 mt-1">
                    Limit reached. Delete some URLs to create new ones.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-10">
          <Button 
            onClick={onCreateNew} 
            disabled={isAtLimit}
            className={`gap-2 shadow-md hover:shadow-lg transition-all duration-200 ${
              isAtLimit 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white'
            }`}
            size="lg"
          >
            <Plus size={20} />
            {isAtLimit ? 'URL Limit Reached' : 'Create New URL'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2 border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md transition-all duration-200"
                size="lg"
              >
                <BarChart3 size={20} />
                Quick Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 shadow-lg border-gray-200">
              <DropdownMenuItem 
                onClick={onExportData} 
                className="gap-3 py-3 cursor-pointer hover:bg-green-50 focus:bg-green-50"
              >
                <Download size={16} />
                Export All URLs
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={onRefreshAll} 
                className="gap-3 py-3 cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
              >
                <RefreshCw size={16} />
                Refresh Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};