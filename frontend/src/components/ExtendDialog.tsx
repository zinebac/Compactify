import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

interface URLData {
  id: string;
  originalUrl: string;
  shortenedUrl: string;
  clicks: number;
  createdAt: string;
  expiresAt: string | null;
  isExpired: boolean;
}

interface ExtendURLDialogProps {
  url: URLData;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExtend: (id: string, hours: number) => Promise<void>;
}

type ExtendDuration = '6' | '12' | '18' | '24';

export const ExtendDialog: React.FC<ExtendURLDialogProps> = ({
  url,
  open,
  onOpenChange,
  onExtend,
}) => {
  const [extendDuration, setExtendDuration] = useState<ExtendDuration>('24');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNewExpiryDate = (): Date | null => {
    if (!url.expiresAt) return null;
    const currentExpiry = new Date(url.expiresAt);
    const hoursToAdd = parseInt(extendDuration);
    return new Date(currentExpiry.getTime() + hoursToAdd * 60 * 60 * 1000);
  };

  const handleExtend = async (): Promise<void> => {
    setIsLoading(true);
    try {
      const extendHours = parseInt(extendDuration);
      await onExtend(url.id, extendHours);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to extend URL lifetime:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDurationChange = (value: string): void => {
    setExtendDuration(value as ExtendDuration);
  };

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
          {/* Current Expiry Information */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="text-sm font-medium text-blue-900 block mb-1">
              Current expiry:
            </Label>
            <p className="text-blue-800 font-medium">
              {url.expiresAt ? formatDate(url.expiresAt) : 'No expiry set'}
            </p>
          </div>
          
          {/* Duration Selection */}
          <div className="space-y-3">
            <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
              Extend by:
            </Label>
            <Select 
              value={extendDuration} 
              onValueChange={handleDurationChange}
            >
              <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6" className="cursor-pointer">6 hours</SelectItem>
                <SelectItem value="12" className="cursor-pointer">12 hours</SelectItem>
                <SelectItem value="18" className="cursor-pointer">18 hours</SelectItem>
                <SelectItem value="24" className="cursor-pointer">24 hours (1 day)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* New Expiry Preview */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-900 mb-1">New expiry:</p>
            <p className="text-green-800 font-medium">
              {getNewExpiryDate()?.toLocaleString() || 'Unable to calculate'}
            </p>
          </div>
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
            disabled={isLoading}
          >
            <Clock size={16} />
            {isLoading ? 'Extending...' : 'Extend Lifetime'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};