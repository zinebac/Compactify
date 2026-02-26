import React, { useState } from 'react';
import { formatDate } from '@/utils/dateUtils';
import { Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import type { URLData } from '@/types';

interface ExtendURLDialogProps {
  url: URLData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtend: (id: string, hours: number) => Promise<void>;
}

type ExtendDuration = 6 | 12 | 24 | 48 | 168; // 1 week = 168 hours

const EXTEND_OPTIONS = [
  { value: 6, label: '6 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '1 day' },
  { value: 48, label: '2 days' },
  { value: 168, label: '1 week' },
] as const;

export const ExtendDialog: React.FC<ExtendURLDialogProps> = ({
  url,
  open,
  onOpenChange,
  onExtend,
}) => {
  const [extendDuration, setExtendDuration] = useState<ExtendDuration>(24);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getNewExpiryDate = (): Date | null => {
    if (!url.expiresAt) return null;
    const currentExpiry = new Date(url.expiresAt);
    return new Date(currentExpiry.getTime() + extendDuration * 60 * 60 * 1000);
  };

  const handleExtend = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      await onExtend(url.id, extendDuration);
      onOpenChange(false);
    } catch (err) {
      const apiErr = err as { message?: string };
      console.error('Failed to extend URL lifetime:', apiErr);
      setError(apiErr.message || 'Failed to extend URL lifetime. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDurationChange = (value: string): void => {
    setExtendDuration(Number(value) as ExtendDuration);
    setError(null);
  };

  const isExpired = url.isExpired;
  const newExpiryDate = getNewExpiryDate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md shadow-xl border-gray-200">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={20} className="text-blue-600" />
            Extend URL Lifetime
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Choose how many hours to extend the lifetime of this URL. The extension will be added to the current expiry time.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* URL Info */}
          <div className="p-3 bg-gray-50 rounded-lg border">
            <Label className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              URL
            </Label>
            <p className="text-sm font-mono text-gray-900 mt-1 truncate" title={url.originalUrl}>
              {url.originalUrl}
            </p>
          </div>

          {/* Current Expiry Information */}
          <div className={`p-4 rounded-lg border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
            <Label className={`text-sm font-medium block mb-1 ${isExpired ? 'text-red-900' : 'text-blue-900'}`}>
              Current expiry:
            </Label>
            <p className={`font-medium ${isExpired ? 'text-red-800' : 'text-blue-800'}`}>
              {url.expiresAt ? formatDate(url.expiresAt) : 'No expiry set'}
            </p>
            {isExpired && (
              <p className="text-xs text-red-600 mt-1">⚠️ This URL has already expired</p>
            )}
          </div>
          
          {/* Duration Selection */}
          <div className="space-y-3">
            <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
              Extend by:
            </Label>
            <Select 
              value={String(extendDuration)} 
              onValueChange={handleDurationChange}
            >
              <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXTEND_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={String(option.value)} className="cursor-pointer">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* New Expiry Preview */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <Label className="text-sm font-medium text-green-900 block mb-1">
              New expiry:
            </Label>
            <p className="text-green-800 font-medium">
              {newExpiryDate ? formatDate(newExpiryDate.toISOString()) : 'Unable to calculate'}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter className="gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="border-gray-300 hover:border-gray-400"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleExtend} 
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
            disabled={isLoading || !newExpiryDate}
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Extending...
              </>
            ) : (
              <>
                <Clock size={16} />
                Extend Lifetime
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};