import React, { useState, useEffect } from 'react';
import type { DashboardData, DashboardQuery, DashboardStats, URLData } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';
import { useAuth } from '@/contexts/AuthContext';
import Nav from '@/components/Nav';
import { Filters } from '@/components/Filters';
import { URLTable } from '@/components/Table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DashboardHeader } from '@/components/DashboardHeader';
import { StatsCards } from '@/components/StatsCard';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<DashboardQuery>({
    page: 1,
    limit: 10,
    sort: 'createdAt',
    order: 'desc',
    filter: 'all'
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { isAuthenticated, user, logout } = useAuth();

  async function fetchDashboard(query: DashboardQuery): Promise<void> {
    try {
      setIsLoading(true);
      const response = await apiService.getDashboardData(query);
      if (response) {
        setData(response);
        setError(null);
      } else {
        setData(null);
        setError('No data found for the given query.');
      }
      console.log('Dashboard data fetched:', response);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to fetch dashboard data.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard(query);
  }, [query]);

  const handleSearch = (term: string): void => {
    setSearchTerm(term);
    setQuery(prev => ({ ...prev, search: term, page: 1 }));
  };

  const handleFilter = (filter: string): void => {
    const value = filter as DashboardQuery['filter'];
    setQuery(prev => ({ ...prev, filter: value, page: 1 }));
  };

  const handleSort = (sortBy: DashboardQuery['sort']): void => {
    setQuery(prev => ({
      ...prev,
      sort: sortBy,
      order: prev.sort === sortBy && prev.order === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  };

  const handlePageChange = (page: number): void => {
    setQuery(prev => ({ ...prev, page }));
  };

  const handleCreateNew = (): void => {
    navigate('/');
  };

  const handleExportData = async (): Promise<void> => {
    try {
      const csvHeader = 'Original URL,Short URL,Clicks,Created At,Expires At,Status\n';
      const csvData = data?.urls?.map((url: URLData) => 
        `"${url.originalUrl}","${url.shortenedUrl}",${url.clicks},"${url.createdAt}","${url.expiresAt || 'Never'}","${url.isExpired ? 'Expired' : 'Active'}"`
      ).join('\n') || '';
      
      const csvContent = csvHeader + csvData;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `url-data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Export successful: URL data exported to CSV');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleRefreshAll = async (): Promise<void> => {
    console.log('Refreshing all data...');
    await fetchDashboard(query);
    console.log('Data refresh completed');
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // URL Management Actions
  const deleteUrl = async (id: string): Promise<void> => {
    try {
      const response = await apiService.deleteUrl(id);
      if (!response) {
        throw new Error('Failed to delete URL');
      }

      setData((prev: any) => ({
        ...prev,
        urls: prev?.urls?.filter((url: URLData) => url.id !== id) || [],
        totalUrls: prev?.totalUrls - 1
      }));
    } catch (error) {
      console.error('Failed to delete URL:', error);
    }
  };

  const regenerateUrl = async (id: string): Promise<void> => {
    try {
      const response = await apiService.regenerateUrl(id);
      if (!response) {
        throw new Error('Failed to regenerate URL');
      }
      setData((prev: any) => ({
        ...prev,
        urls: prev?.urls?.map((url: URLData) => 
          url.id === id ? { ...url, shortenedUrl: response.shortenedUrl } : url
        ) || []
      }));
    } catch (error) {
      console.error('Failed to regenerate URL:', error);
    }
  };

  const extendUrl = async (id: string, hours: any): Promise<void> => {
    try {
      const response = await apiService.extendUrl(id, hours);
      if (!response) {
        throw new Error('Failed to extend URL lifetime');
      }
      setData((prev: any) => ({
        ...prev,
        urls: prev?.urls?.map((url: URLData) => 
          url.id === id ? { ...url, expiresAt: response.expiresAt } : url
        ) || []
      }));
    } catch (error) {
      console.error('Failed to extend URL lifetime:', error);
    }
  };

  const handleBulkDeleteExpired = async (): Promise<void> => {
    const expiredUrls = data?.urls?.filter((url: URLData) => url.isExpired) || [];
    
    if (expiredUrls.length === 0) {
      console.log('No expired URLs to delete');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${expiredUrls.length} expired URLs? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        // Implement bulk delete API call when ready
        console.log(`Bulk delete would delete: ${expiredUrls.length} expired URLs`);
        await fetchDashboard(query);
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  const handleBulkDelete = async (urls: string[]): Promise<void> => {
    if (urls.length === 0) {
      console.log('No URLs selected for deletion');
      return;
    }
      try {
        await Promise.all(urls.map(id => apiService.deleteUrl(id)));
        setData((prev: any) => ({
          ...prev,
          urls: prev?.urls?.filter((url: URLData) => !urls.includes(url.id)) || [],
          totalUrls: prev?.totalUrls - urls.length
        }));
        console.log(`${urls.length} URLs deleted successfully`);
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
  }

  const handleBulkRegenerate = async (urls: string[]): Promise<void> => {
    if (urls.length === 0) {
      console.log('No URLs selected for regeneration');
      return;
    }

    try {
      const updatedUrls = await Promise.all(urls.map(id => apiService.regenerateUrl(id)));
      const shortenedUrls = updatedUrls.map((url: any) => ({
        id: url.id,
        shortenedUrl: url.shortenedUrl
      }));

      if (!shortenedUrls || shortenedUrls.length === 0) {
        console.log('No URLs were regenerated');
        return;
      }

      setData((prev: any) => ({
        ...prev,
        urls: prev?.urls?.map((url: URLData) => 
          shortenedUrls.find((u: any) => u.id === url.id) ? { ...url, shortenedUrl: shortenedUrls.find((u: any) => u.id === url.id)?.shortenedUrl } : url
        ) || []
      }));
    } catch (error) {
      console.error('Bulk regeneration failed:', error);
    }
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-600 text-lg font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const dashboardStats: DashboardStats = {
    totalUrls: data?.totalUrls || 0,
    totalClicks: data?.urls?.reduce((sum: number, url: URLData) => sum + url.clicks, 0) || 0,
    activeUrls: data?.urls?.filter((url: URLData) => !url.isExpired).length || 0,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Nav isAuthenticated={isAuthenticated} user={user} handleLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Enhanced Header with smooth animation */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <DashboardHeader
            user={user}
            totalUrls={dashboardStats.totalUrls}
            totalClicks={dashboardStats.totalClicks}
            activeUrls={dashboardStats.activeUrls}
            onCreateNew={handleCreateNew}
            onExportData={handleExportData}
            onBulkDelete={handleBulkDeleteExpired}
            onRefreshAll={handleRefreshAll}
          />
        </motion.div>

        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn} 
          transition={{ delay: 0.1 }}
        >
          <StatsCards
            user={user}
            totalUrls={dashboardStats.totalUrls}
            totalClicks={dashboardStats.totalClicks}
            activeUrls={dashboardStats.activeUrls}
          />

        </motion.div>

        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn} 
          transition={{ delay: 0.2 }}
        >
          <Filters
            searchTerm={searchTerm}
            onSearch={handleSearch}
            filter={query.filter}
            onFilterChange={handleFilter}
          />
        </motion.div>

        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={fadeIn} 
          transition={{ delay: 0.3 }}
        >
          {error && (
            <Alert variant="destructive" className="mb-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <URLTable
            data={data}
            query={query}
            onSort={handleSort}
            onPageChange={handlePageChange}
            onDelete={deleteUrl}
            onBulkDelete={handleBulkDelete}
            onBulkRegenerate={handleBulkRegenerate}
            onRegenerate={regenerateUrl}
            onExtend={extendUrl}
            onCreateNew={handleCreateNew}
          />
        </motion.div>
      </main>
    </div>
  );
};