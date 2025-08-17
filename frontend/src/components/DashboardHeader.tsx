import React from 'react';
import { 
  Plus, 
  Download, 
  BarChart3, 
  Trash2, 
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface DashboardHeaderProps {
  user: any;
  totalUrls: number;
  totalClicks: number;
  activeUrls: number;
  onCreateNew: () => void;
  onExportData: () => void;
  onBulkDelete: () => void;
  onRefreshAll: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  user,
  onCreateNew,
  onExportData,
  onBulkDelete,
  onRefreshAll,
}) => {
  const getCurrentTimeGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-between gap-6">
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-10">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
                {getCurrentTimeGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your links and track their performance
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pb-10">
          <Button 
            onClick={onCreateNew} 
            className="gap-2 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            size="lg"
          >
            <Plus size={20} />
            Create New URL
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
                Refresh All URLs
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={onBulkDelete} 
                className="gap-3 py-3 text-destructive focus:text-destructive cursor-pointer hover:bg-red-50 focus:bg-red-50"
              >
                <Trash2 size={16} />
                Bulk Delete Expired
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};