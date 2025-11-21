import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  categories: string[];
}

// Note: The prop names remain the same for backward compatibility, 
// but internally we're now working with departments

export default function SearchFilters({
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  categories
}: SearchFiltersProps) {
  const [searchValue, setSearchValue] = useState("");
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    onSearchChange(value);
  };
  
  const handleCategoryChange = (value: string) => {
    onCategoryChange(value);
  };
  
  const handleStatusChange = (value: string) => {
    onStatusChange(value);
  };
  
  return (
    <div className="mt-6 bg-white shadow rounded-lg p-4">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
        <div className="flex-1">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-neutral-medium" />
            </div>
            <Input
              type="text"
              value={searchValue}
              onChange={handleSearchChange}
              className="pl-10"
              placeholder="Search applications..."
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="w-full sm:w-40">
            <Select onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Departments</SelectItem>
                {categories.map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-40">
            <Select onValueChange={handleStatusChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
