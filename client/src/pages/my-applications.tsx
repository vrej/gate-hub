import { useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import SearchFilters from "@/components/dashboard/search-filters";
import ApplicationCard from "@/components/dashboard/application-card";
import { useApplications } from "@/hooks/use-excel";
import { Loader2 } from "lucide-react";

export default function MyApplications() {
  const { data: applications, isLoading } = useApplications();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Get unique departments from applications
  const departments = useMemo(() => {
    if (!applications) return [];
    const allDepartments = applications.map(app => app.department);
    return [...new Set(allDepartments)];
  }, [applications]);
  
  // Filter applications based on search and filters
  const filteredApplications = useMemo(() => {
    if (!applications) return [];
    
    return applications.filter(app => {
      const matchesSearch = searchQuery === "" || 
        app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.description.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesDepartment = departmentFilter === "" || app.department === departmentFilter;
      const matchesStatus = statusFilter === "" || app.status === statusFilter;
      
      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [applications, searchQuery, departmentFilter, statusFilter]);
  
  return (
    <AppShell 
      title="My Applications" 
      subtitle="View and access your approved applications"
    >
      <SearchFilters 
        onSearchChange={setSearchQuery}
        onCategoryChange={setDepartmentFilter}
        onStatusChange={setStatusFilter}
        categories={departments}
      />
      
      {/* Applications Grid */}
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <p className="text-neutral-medium">No applications found.</p>
            {searchQuery || departmentFilter || statusFilter ? (
              <p className="mt-2 text-sm text-neutral-medium">
                Try adjusting your search criteria.
              </p>
            ) : (
              <p className="mt-2 text-sm text-neutral-medium">
                You currently don't have access to any applications.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredApplications.map((application) => (
              <ApplicationCard 
                key={application.id} 
                application={application} 
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
