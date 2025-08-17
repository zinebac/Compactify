import React, { useState, useEffect } from 'react';
import { 
  SortAsc, 
  SortDesc, 
  Plus, 
  Link2, 
  Trash2, 
  RefreshCw, 
  CalendarPlus,
  X,
  CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableHead, TableHeader, TableRow as TableR } from '@/components/ui/table';
import { TableRow } from './TableRow';
import type { DashboardQuery } from '@/types';

interface URLData {
  id: string;
  originalUrl: string;
  shortenedUrl: string;
  clicks: number;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
}

interface TableData {
  currentPage: number;
  urls: URLData[];
  totalClicks: number;
  totalUrls: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface URLTableProps {
  data: TableData | null;
  query: DashboardQuery;
  onSort: (sortBy: DashboardQuery['sort']) => void;
  onPageChange: (page: number) => void;
  onDelete: (id: string) => Promise<void>;
  onRegenerate: (id: string) => Promise<void>;
  onExtend: (id: string, hours: number) => Promise<void>;
  onCreateNew: () => void;
  onBulkDelete?: (ids: string[]) => Promise<void>;
  onBulkRegenerate?: (ids: string[]) => Promise<void>;
  onBulkExtend?: (ids: string[], hours: number) => Promise<void>;
}

interface SelectedStats {
  total: number;
  active: number;
  expired: number;
  withExpiry: number;
}

export const URLTable: React.FC<URLTableProps> = ({
  data,
  query,
  onSort,
  onPageChange,
  onDelete,
  onRegenerate,
  onExtend,
  onCreateNew,
  onBulkDelete,
  onBulkRegenerate,
  onBulkExtend,
}) => {
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [isSelectAllChecked, setIsSelectAllChecked] = useState<boolean>(false);

  const urls = data?.urls || [];

  useEffect(() => {
    setSelectedUrls([]);
    setIsSelectAllChecked(false);
  }, [data]);

  useEffect(() => {
    const allSelected = urls.length > 0 && selectedUrls.length === urls.length;
    setIsSelectAllChecked(allSelected);
  }, [selectedUrls, urls.length]);

  const handleSelectAll = (checked: boolean): void => {
    if (checked) {
      setSelectedUrls(urls.map((url: URLData) => url.id));
    } else {
      setSelectedUrls([]);
    }
  };

  const handleSelectUrl = (urlId: string, checked: boolean): void => {
    if (checked) {
      setSelectedUrls(prev => [...prev, urlId]);
    } else {
      setSelectedUrls(prev => prev.filter(id => id !== urlId));
    }
  };

  const clearSelection = (): void => {
    setSelectedUrls([]);
  };

  const getSortIcon = (column: string): React.ReactNode => {
    if (query.sort !== column) return null;
    return query.order === 'desc' ? <SortDesc size={16} /> : <SortAsc size={16} />;
  };

  const SortableHeader: React.FC<{ column: DashboardQuery['sort']; children: React.ReactNode }> = ({ 
    column, 
    children 
  }) => (
    <TableHead 
      className="cursor-pointer hover:bg-gray-100 transition-colors group"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span className="group-hover:text-gray-900 transition-colors">{children}</span>
        {getSortIcon(column as string)}
      </div>
    </TableHead>
  );

  // Bulk Actions
  const handleBulkDelete = async (): Promise<void> => {    
    if (onBulkDelete) {
      try {
        await onBulkDelete(selectedUrls);
        clearSelection();
        console.log(`Bulk deleted ${selectedUrls.length} URLs`);
      } catch (error) {
        console.error('Bulk delete failed:', error);
      }
    }
  };

  const handleBulkRegenerate = async (): Promise<void> => {
    // const confirmed = window.confirm(
    //   `Are you sure you want to regenerate ${selectedUrls.length} selected URL${selectedUrls.length > 1 ? 's' : ''}? This will create new short codes.`
    // );
    
    if (onBulkRegenerate) {
      try {
        await onBulkRegenerate(selectedUrls);
        clearSelection();
        console.log(`Bulk regenerated ${selectedUrls.length} URLs`);
      } catch (error) {
        console.error('Bulk regenerate failed:', error);
      }
    }
  };

  const handleBulkExtend = async (hours: number = 24): Promise<void> => {
    if (onBulkExtend) {
      try {
        await onBulkExtend(selectedUrls, hours);
        clearSelection();
        console.log(`Bulk extended ${selectedUrls.length} URLs by ${hours} hours`);
      } catch (error) {
        console.error('Bulk extend failed:', error);
      }
    }
  };

  // Get stats for selected URLs
  const selectedStats: SelectedStats = {
    total: selectedUrls.length,
    active: selectedUrls.filter(id => {
      const url = urls.find((u: URLData) => u.id === id);
      return url && !url.isExpired;
    }).length,
    expired: selectedUrls.filter(id => {
      const url = urls.find((u: URLData) => u.id === id);
      return url && url.isExpired;
    }).length,
    withExpiry: selectedUrls.filter(id => {
      const url = urls.find((u: URLData) => u.id === id);
      return url && url.expiresAt && !url.isExpired;
    }).length,
  };

  if (!data || urls.length === 0) {
    return (
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors shadow-md">
        <CardContent className="p-16 text-center">
          <div className="flex flex-col items-center space-y-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
              <Link2 className="h-12 w-12 text-gray-400" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-900">No URLs found</h3>
              <p className="text-gray-500 max-w-md text-lg">
                {query.search 
                  ? 'No URLs match your search criteria. Try adjusting your filters or search terms.' 
                  : 'Get started by creating your first shortened URL and track its performance.'
                }
              </p>
            </div>
            <Button 
              onClick={onCreateNew} 
              className="gap-2 mt-6 bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
              size="lg"
            >
              <Plus size={20} />
              Create your first URL
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Actions Bar */}
      {selectedUrls.length > 0 && (
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    {selectedStats.total} URL{selectedStats.total > 1 ? 's' : ''} selected
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 font-medium">
                    {selectedStats.active} Active
                  </Badge>
                  {selectedStats.expired > 0 && (
                    <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-300 font-medium">
                      {selectedStats.expired} Expired
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 transition-colors duration-200"
                >
                  <Trash2 size={14} />
                  Delete Selected
                </Button>

                {selectedStats.active > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkRegenerate}
                    className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 transition-colors duration-200"
                  >
                    <RefreshCw size={14} />
                    Regenerate
                  </Button>
                )}

                {selectedStats.withExpiry > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkExtend(24)}
                    className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 transition-colors duration-200"
                  >
                    <CalendarPlus size={14} />
                    Extend 24h
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="gap-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                >
                  <X size={14} />
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Table */}
      <Card className="shadow-lg border-gray-200 hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Your URLs</h3>
              <p className="text-sm text-gray-500 mt-1">
                Manage and track your shortened URLs
              </p>
            </div>
            <Badge variant="secondary" className="text-sm font-medium bg-gray-100 text-gray-700">
              {data.totalUrls} total
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableR className="border-b border-gray-200">
                  <TableHead className="w-12 p-4">
                    <Checkbox
                      onCheckedChange={handleSelectAll}
                      checked={
                        selectedUrls.length > 0 && selectedUrls.length < urls.length
                        ? 'indeterminate'
                        : isSelectAllChecked
                      }
                      className="border-gray-400"
                    />
                  </TableHead>
                  <TableHead className="font-semibold text-gray-800 p-4">Original URL</TableHead>
                  <TableHead className="font-semibold text-gray-800 p-4">Short URL</TableHead>
                  <SortableHeader column="clickCount">
                    <span className="font-semibold text-gray-800">Clicks</span>
                  </SortableHeader>
                  <SortableHeader column="createdAt">
                    <span className="font-semibold text-gray-800">Created</span>
                  </SortableHeader>
                  <TableHead className="font-semibold text-gray-800 p-4">Status</TableHead>
                  <TableHead className="font-semibold text-gray-800 p-4">Expires</TableHead>
                  <TableHead className="text-right font-semibold text-gray-800 p-4">Actions</TableHead>
                </TableR>
              </TableHeader>
              <TableBody>
                {urls.map((url: URLData, index: number) => (
                  <TableRow
                    key={url.id}
                    url={url}
                    isSelected={selectedUrls.includes(url.id)}
                    onSelect={(checked: boolean) => handleSelectUrl(url.id, checked)}
                    onDelete={onDelete}
                    onRegenerate={onRegenerate}
                    onExtend={onExtend}
                    className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100'}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <>
              <Separator className="bg-gray-200" />
              <div className="flex items-center justify-between p-6 bg-gray-50">
                <div className="text-sm text-gray-600">
                  Showing{' '}
                  <span className="font-semibold text-gray-900">
                    {((data.page - 1) * data.limit) + 1}
                  </span>
                  {' '}to{' '}
                  <span className="font-semibold text-gray-900">
                    {Math.min(data.page * data.limit, data.totalUrls)}
                  </span>
                  {' '}of{' '}
                  <span className="font-semibold text-gray-900">
                    {data.totalUrls}
                  </span>
                  {' '}results
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => onPageChange(data.page - 1)}
                    disabled={data.page === 1}
                    variant="outline"
                    size="sm"
                    className="gap-1 border-gray-300 hover:border-gray-400 disabled:opacity-50"
                  >
                    Previous
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <Button
                          key={page}
                          onClick={() => onPageChange(page)}
                          variant={data.page === page ? "default" : "ghost"}
                          size="sm"
                          className={`w-10 h-10 p-0 ${
                            data.page === page 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    {data.totalPages > 5 && (
                      <>
                        <span className="text-gray-400 px-2">...</span>
                        <Button
                          onClick={() => onPageChange(data.totalPages)}
                          variant={data.page === data.totalPages ? "default" : "ghost"}
                          size="sm"
                          className={`w-10 h-10 p-0 ${
                            data.page === data.totalPages 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {data.totalPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    onClick={() => onPageChange(data.page + 1)}
                    disabled={data.page === data.totalPages}
                    variant="outline" 
                    size="sm"
                    className="gap-1 border-gray-300 hover:border-gray-400 disabled:opacity-50"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};