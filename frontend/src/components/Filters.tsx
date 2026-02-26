import React from 'react';
import { Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DashboardQuery } from '@/types';

interface FiltersProps {
  searchTerm: string;
  onSearch: (term: string) => void;
  filter: DashboardQuery['filter'];
  onFilterChange: (filter: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  onSearch,
  filter,
  onFilterChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    onSearch(e.target.value);
  };

  return (
    <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative group">
              <Search 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" 
                size={20} 
              />
              <Input
                placeholder="Search URLs by domain, title, or short code..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400 hover:border-gray-400 transition-colors duration-200"
              />
            </div>
          </div>

          {/* Filter Select */}
          <Select value={filter} onValueChange={onFilterChange}>
            <SelectTrigger className="w-full md:w-48 border-gray-300 focus:border-blue-500 focus:ring-blue-500 hover:border-gray-400 transition-colors duration-200">
              <SelectValue placeholder="Filter URLs" />
            </SelectTrigger>
            <SelectContent className="shadow-lg border-gray-200">
              <SelectItem 
                value="all" 
                className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
              >
                All URLs
              </SelectItem>
              <SelectItem 
                value="active" 
                className="cursor-pointer hover:bg-green-50 focus:bg-green-50"
              >
                Active URLs
              </SelectItem>
              <SelectItem 
                value="expired" 
                className="cursor-pointer hover:bg-red-50 focus:bg-red-50"
              >
                Expired URLs
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};