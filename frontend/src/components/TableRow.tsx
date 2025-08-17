import React, { useState } from 'react';
import { 
  Copy, 
  Trash2, 
  RefreshCw, 
  ExternalLink, 
  BarChart3,
  Activity,
  CalendarPlus,
  MoreHorizontal,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow as TableR } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ExtendDialog } from './ExtendDialog';
import { cn } from '@/lib/utils';

interface URLData {
  id: string;
  originalUrl: string;
  shortenedUrl: string;
  clicks: number;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
}

interface TableRowProps {
  url: URLData;
  isSelected?: boolean;
  onSelect?: (checked: boolean) => void;
  onDelete: (id: string) => Promise<void>;
  onRegenerate: (id: string) => Promise<void>;
  onExtend: (id: string, hours: number) => Promise<void>;
  className?: string;
}

type ExpiryStatus = 'expired' | 'expiring-soon' | 'active' | null;

export const TableRow: React.FC<TableRowProps> = ({
  url,
  isSelected = false,
  onSelect,
  onDelete,
  onRegenerate,
  onExtend,
  className,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [extendDialogOpen, setExtendDialogOpen] = useState<boolean>(false);
  console.log('Rendering TableRow for URL:', url);

  const handleOpenUrl = (shortenedUrl: string): void => {
    try {
      window.open(shortenedUrl, '_blank');
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntilExpiry = (expiryDate: string | null): string | null => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs <= 0) return 'Expired';
    if (diffDays > 0) return `${diffDays}d`;
    return `${diffHours}h`;
  };

  const getExpiryStatus = (expiryDate: string | null): ExpiryStatus => {
    if (!expiryDate) return null;
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffMs = expiry.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffMs <= 0) return 'expired';
    if (diffHours <= 24) return 'expiring-soon';
    return 'active';
  };

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(url.shortenedUrl);
      setCopiedId(url.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await onDelete(url.id);
    } catch (error) {
      console.error('Failed to delete URL:', error);
    }
  };

  const handleRegenerate = async (): Promise<void> => {
    try {
      await onRegenerate(url.id);
    } catch (error) {
      console.error('Failed to regenerate URL:', error);
    }
  };

  const expiryStatus = getExpiryStatus(url.expiresAt);
  const timeUntilExpiry = getTimeUntilExpiry(url.expiresAt);

  return (
    <TableR 
      className={cn(
        "border-b border-gray-100 transition-all duration-200 hover:shadow-md group",
        isSelected && "bg-blue-50 border-blue-200 shadow-sm",
        className
      )}
    >
      <TableCell className="p-4">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="border-gray-400 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
        />
      </TableCell>

      <TableCell className="max-w-0 w-1/3 p-4">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div 
              className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 transition-colors duration-200" 
              title={url.originalUrl}
              onClick={() => window.open(url.originalUrl, '_blank')}
            >
              {url.originalUrl}
            </div>
            <div className="text-xs text-gray-500 mt-1 font-medium">
              {new URL(url.originalUrl).hostname}
            </div>
          </div>
        </div>
      </TableCell>
      
      <TableCell className="p-4">
        <div className="flex items-center gap-2">
          <code 
            className="text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md font-mono text-blue-700 cursor-pointer transition-colors duration-200"
            onClick={copyToClipboard}
            title="Click to copy"
          >
            {url.shortenedUrl.replace(/^https?:\/\//, '')}
          </code>
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-blue-100"
          >
            <Copy size={14} />
          </Button>
        </div>
      </TableCell>
      
      <TableCell className="p-4">
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className="gap-1 bg-green-100 text-green-800 hover:bg-green-200 transition-colors duration-200 font-medium"
          >
            <BarChart3 size={12} />
            {url.clicks.toLocaleString()}
          </Badge>
          {url.clicks > 0 && (
            <div className="text-xs text-green-600 flex items-center gap-1 font-medium">
              <TrendingUp size={10} />
              Active
            </div>
          )}
        </div>
      </TableCell>
      
      <TableCell className="text-sm text-gray-600 p-4">
        <div className="flex flex-col">
          <span className="font-medium">{formatDate(url.createdAt)}</span>
          <span className="text-xs text-gray-400 mt-1">
            {Math.floor((Date.now() - new Date(url.createdAt).getTime()) / (1000 * 60 * 60 * 24))}d ago
          </span>
        </div>
      </TableCell>
      
      <TableCell className="p-4">
        <Badge 
          variant={url.isExpired ? "destructive" : "default"}
          className={cn(
            "gap-1 transition-colors duration-200 font-medium",
            url.isExpired 
              ? "bg-red-100 text-red-800 border-red-200 hover:bg-red-200" 
              : expiryStatus === 'expiring-soon'
              ? "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
              : "bg-green-100 text-green-800 border-green-200 hover:bg-green-200"
          )}
        >
          <Activity size={12} />
          {url.isExpired ? 'Expired' : expiryStatus === 'expiring-soon' ? 'Expiring Soon' : 'Active'}
        </Badge>
      </TableCell>
      
      {/* Enhanced Expiry */}
      <TableCell className="p-4">
        {url.expiresAt ? (
          <div className="text-sm">
            <div className={cn(
              "font-semibold flex items-center gap-1",
              expiryStatus === 'expired' && "text-red-600",
              expiryStatus === 'expiring-soon' && "text-yellow-600",
              expiryStatus === 'active' && "text-gray-900"
            )}>
              <Clock size={12} />
              {timeUntilExpiry}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDate(url.expiresAt)}
            </div>
          </div>
        ) : (
          <Badge 
            variant="outline" 
            className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors duration-200 font-medium"
          >
            Permanent
          </Badge>
        )}
      </TableCell>
      
      {/* Actions */}
      <TableCell className="text-right p-4">
        <div className="flex items-center justify-end gap-1">
          {/* Copy Button */}
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="sm"
            className={cn(
              "gap-1 transition-all duration-200",
              copiedId === url.id 
                ? "text-green-700 bg-green-100 hover:bg-green-200" 
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            )}
          >
            <Copy size={14} />
            {copiedId === url.id ? 'Copied!' : 'Copy'}
          </Button>
          
          {/* Extend Button */}
          {url.expiresAt && !url.isExpired && (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-100 transition-colors duration-200"
                onClick={() => setExtendDialogOpen(true)}
              >
                <CalendarPlus size={14} />
                Extend
              </Button>
              
              <ExtendDialog
                url={url}
                open={extendDialogOpen}
                onOpenChange={setExtendDialogOpen}
                onExtend={onExtend}
              />
            </>
          )}

          {/* More Actions Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              >
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 shadow-lg border-gray-200">
              <DropdownMenuItem 
                onClick={() => handleOpenUrl(url.shortenedUrl)}
                className="gap-2 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 py-3"
              >
                <ExternalLink size={14} />
                Visit Original URL
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleRegenerate} 
                className="gap-2 cursor-pointer hover:bg-blue-50 focus:bg-blue-50 py-3"
              >
                <RefreshCw size={14} />
                Regenerate Code
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleDelete}
                className="gap-2 text-red-600 focus:text-red-600 hover:bg-red-50 focus:bg-red-50 cursor-pointer py-3"
              >
                <Trash2 size={14} />
                Delete URL
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TableCell>
    </TableR>
  );
};