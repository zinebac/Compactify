import React, { useState, useEffect, useMemo } from 'react';
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
import { AlertCircle, AlertTriangle } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

// URL limit constants
const URL_LIMITS = {
  MAX_URLS_PER_USER: 50,
  WARNING_THRESHOLD: 0.8, // Show warning at 80% capacity
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

  const dashboardStats: DashboardStats = useMemo(() => {
    if (!data) {
      return {
        totalUrls: 0,
        totalClicks: 0,
        activeUrls: 0,
        maxUrls: URL_LIMITS.MAX_URLS_PER_USER,
      };
    }

    return {
      totalUrls: data.pagination.totalUrls,
      totalClicks: data.stats.totalClicks,
      activeUrls: data.urls.filter((url: URLData) => !url.isExpired).length,
      maxUrls: URL_LIMITS.MAX_URLS_PER_USER,
    };
  }, [data]);

  // Check if user is near URL limit
  const isNearLimit = useMemo(() => {
    return dashboardStats.totalUrls >= URL_LIMITS.MAX_URLS_PER_USER * URL_LIMITS.WARNING_THRESHOLD;
  }, [dashboardStats.totalUrls]);

  const isAtLimit = useMemo(() => {
    return dashboardStats.totalUrls >= URL_LIMITS.MAX_URLS_PER_USER;
  }, [dashboardStats.totalUrls]);

  async function fetchDashboard(query: DashboardQuery): Promise<void> {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiService.getDashboardData(query);
      
      if (response) {
        setData(response);
      } else {
        setData(null);
        setError('No data found for the given query.');
      }
    } catch (error: any) {
      console.error('Error fetching dashboard:', error);
      
      if (error.statusCode === 401) {
        setError('Your session has expired. Please sign in again.');
        // Optionally redirect to auth
        setTimeout(() => navigate('/auth'), 3000);
      } else {
        setError(error.message || 'Failed to fetch dashboard data.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboard(query);
    }
  }, [query, isAuthenticated]);

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
      sortBy,
      sortOrder: prev.sort === sortBy && prev.order === 'desc' ? 'asc' : 'desc',
      page: 1
    }));
  };

  const handlePageChange = (page: number): void => {
    setQuery(prev => ({ ...prev, page }));
  };

  const handleCreateNew = (): void => {
    if (isAtLimit) {
      setError(`You have reached your URL limit (${URL_LIMITS.MAX_URLS_PER_USER}). Please delete some URLs to create new ones.`);
      return;
    }
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
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export data. Please try again.');
    }
  };

  const handleRefreshAll = async (): Promise<void> => {
    await fetchDashboard(query);
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ✅ Enhanced URL Management Actions with better error handling
  const deleteUrl = async (id: string): Promise<void> => {
    try {
      await apiService.deleteUrl(id);
      
      // Update local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          urls: prev.urls.filter((url: URLData) => url.id !== id),
          pagination: {
            ...prev.pagination,
            totalUrls: prev.pagination.totalUrls - 1,
          },
        };
      });
      
      setError(null); // Clear any existing errors
    } catch (error: any) {
      console.error('Failed to delete URL:', error);
      setError(error.message || 'Failed to delete URL. Please try again.');
    }
  };

  const regenerateUrl = async (id: string): Promise<void> => {
    try {
      const response = await apiService.regenerateUrl(id);
      
      if (response?.shortenedUrl) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            urls: prev.urls.map((url: URLData) => 
              url.id === id ? { ...url, shortenedUrl: response.shortenedUrl } : url
            ),
          };
        });
        setError(null);
      }
    } catch (error: any) {
      console.error('Failed to regenerate URL:', error);
      setError(error.message || 'Failed to regenerate URL. Please try again.');
    }
  };

  const extendUrl = async (id: string, newExpiresAt: string): Promise<void> => {
    try {
      const response = await apiService.extendUrl(id, newExpiresAt);
      
      if (response?.expiresAt) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            urls: prev.urls.map((url: URLData) => 
              url.id === id ? { ...url, expiresAt: response.expiresAt } : url
            ),
          };
        });
        setError(null);
      }
    } catch (error: any) {
      console.error('Failed to extend URL:', error);
      setError(error.message || 'Failed to extend URL lifetime. Please try again.');
    }
  };

  const handleBulkDelete = async (urls: string[]): Promise<void> => {
    if (urls.length === 0) return;

    try {
      await Promise.all(urls.map(id => apiService.deleteUrl(id)));
      
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          urls: prev.urls.filter((url: URLData) => !urls.includes(url.id)),
          pagination: {
            ...prev.pagination,
            totalUrls: prev.pagination.totalUrls - urls.length,
          },
        };
      });
      
      setError(null);
    } catch (error: any) {
      console.error('Bulk delete failed:', error);
      setError(error.message || 'Failed to delete selected URLs. Please try again.');
    }
  };

  const handleBulkRegenerate = async (urls: string[]): Promise<void> => {
    if (urls.length === 0) return;

    try {
      const responses = await Promise.all(urls.map(id => apiService.regenerateUrl(id)));
      
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          urls: prev.urls.map((url: URLData) => {
            const response = responses.find(r => r.id === url.id);
            return response ? { ...url, shortenedUrl: response.shortenedUrl } : url;
          }),
        };
      });
      
      setError(null);
    } catch (error: any) {
      console.error('Bulk regenerate failed:', error);
      setError(error.message || 'Failed to regenerate selected URLs. Please try again.');
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Nav isAuthenticated={isAuthenticated} user={user} handleLogout={handleLogout} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* ✅ URL Limit Warning */}
        {isNearLimit && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <Alert 
              variant={isAtLimit ? "destructive" : "default"} 
              className={`border-2 ${isAtLimit ? 'border-red-300 bg-red-50' : 'border-yellow-300 bg-yellow-50'}`}
            >
              {isAtLimit ? <AlertCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              <AlertDescription className={isAtLimit ? 'text-red-800' : 'text-yellow-800'}>
                {isAtLimit 
                  ? `You have reached your URL limit (${dashboardStats.totalUrls}/${dashboardStats.maxUrls}). Delete some URLs to create new ones.`
                  : `You're approaching your URL limit (${dashboardStats.totalUrls}/${dashboardStats.maxUrls}). Consider managing your existing URLs.`
                }
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* Header */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          <DashboardHeader
            user={user}
            totalUrls={dashboardStats.totalUrls}
            totalClicks={dashboardStats.totalClicks}
            activeUrls={dashboardStats.activeUrls}
            maxUrls={dashboardStats.maxUrls}
            isAtLimit={isAtLimit}
            onCreateNew={handleCreateNew}
            onExportData={handleExportData}
            onRefreshAll={handleRefreshAll}
          />
        </motion.div>

        {/* Stats Cards */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }}>
          <StatsCards
            user={user}
            totalUrls={dashboardStats.totalUrls}
            totalClicks={dashboardStats.totalClicks}
            activeUrls={dashboardStats.activeUrls}
            maxUrls={dashboardStats.maxUrls}
          />
        </motion.div>

        {/* Filters */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.2 }}>
          <Filters
            searchTerm={searchTerm}
            onSearch={handleSearch}
            filter={query.filter}
            onFilterChange={handleFilter}
          />
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <Alert variant="destructive" className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {error}
                <button 
                  onClick={() => setError(null)} 
                  className="ml-2 underline hover:no-underline"
                >
                  Dismiss
                </button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {/* URL Table */}
        <motion.div initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.3 }}>
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
            isAtLimit={isAtLimit}
          />
        </motion.div>
      </main>
    </div>
  );
};