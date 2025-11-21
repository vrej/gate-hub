import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import ApplicationCard from "@/components/application-card";
import RequestModal from "@/components/request-modal";
import RequestAccessModal from "@/components/request-access-modal";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Plus, Grid3X3, List, ChevronLeft, ChevronRight, X } from "lucide-react";
import { ApplicationWithRelations, Department } from "@shared/schema";

export default function Applications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isRequestAccessModalOpen, setIsRequestAccessModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);

  const { data: allApplications = [], isLoading } = useQuery<ApplicationWithRelations[]>({
    queryKey: ["/api/applications"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: statuses = [] } = useQuery<any[]>({
    queryKey: ["/api/statuses"],
  });

  const { data: heroBanner } = useQuery<any>({
    queryKey: ["/api/hero-banner"],
  });

  // Filter and search applications
  const filteredApplications = allApplications.filter((app: ApplicationWithRelations) => {
    // Search filter
    if (searchQuery && !app.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !app.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter
    if (selectedStatus !== "all" && app.status?.name !== selectedStatus) {
      return false;
    }

    // Department filter - check if the app is approved for the selected department
    if (selectedDepartment !== "all") {
      const approvedDepts = app.departments?.map(dept => dept.name) || [];
      if (!approvedDepts.includes(selectedDepartment) && 
          !approvedDepts.includes('All Departments')) {
        return false;
      }
    }

    // Category filter
    if (selectedCategory !== "all") {
      if (selectedCategory === "uncategorized") {
        // Show apps with no category
        if (app.categories && app.categories.length > 0) {
          return false;
        }
      } else {
        // Show apps with the selected category
        const categoryNames = app.categories?.map(cat => cat.name) || [];
        if (!categoryNames.includes(selectedCategory)) {
          return false;
        }
      }
    }



    return true;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "status":
        const statusA = a.status?.name || "";
        const statusB = b.status?.name || "";
        // Case-insensitive comparison for consistent sorting
        return statusA.toLowerCase().localeCompare(statusB.toLowerCase());
      default:
        return 0;
    }
  });

  // Pagination calculations
  const totalItems = sortedApplications.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedApplications = sortedApplications.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const resetPage = () => setCurrentPage(1);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedDepartment !== "all" || selectedCategory !== "all" || 
                          selectedStatus !== "all";

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedDepartment("all");
    setSelectedCategory("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  const handleRequestAccess = () => {
    setSelectedApplication(null);
    setIsRequestModalOpen(true);
  };

  const handleRequestAccessForApplication = (application: ApplicationWithRelations) => {
    setSelectedApplication(application);
    setIsRequestAccessModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="gradient-bg py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              <span className="text-brand">{heroBanner?.brandName || "WhyBrands"}</span>{" "}
              {heroBanner?.title?.replace(heroBanner?.brandName || "WhyBrands", "").trim() || "Application Portal"}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed px-4">
              {heroBanner?.subtitle || "Find and request access to approved software applications for your department."}
            </p>
          </div>
        </div>
      </section>

      {/* Applications Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search and Filter Bar */}
          <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-8">
            {/* First Row - Search and Basic Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
              {/* Search Input */}
              <div className="sm:col-span-2 lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search applications..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Department Filter */}
              <div>
                <Select value={selectedDepartment} onValueChange={(value) => { setSelectedDepartment(value); resetPage(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept: any) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); resetPage(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="uncategorized">No Category</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category.id} value={category.name}>
                        <span>{category.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Status Filter */}
              <div>
                <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); resetPage(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {statuses.map((status: any) => (
                      <SelectItem key={status.id} value={status.name}>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-2 h-2 rounded-full inline-block" 
                            style={{ backgroundColor: status.color }}
                          ></span>
                          <span>
                            {status.name.charAt(0).toUpperCase() + status.name.slice(1)}
                          </span>
                          {status.description && (
                            <span className="text-xs text-gray-500 truncate max-w-[150px]">
                              - {status.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>



            {/* Sort Options, View Toggle and Clear Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 pt-4 border-t border-gray-200 space-y-4 sm:space-y-0">
              <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <button
                  onClick={() => setSortBy("name")}
                  className={`text-sm font-medium ${
                    sortBy === "name" ? "text-brand" : "text-gray-500 hover:text-brand"
                  }`}
                >
                  Name
                </button>
                <button
                  onClick={() => setSortBy("status")}
                  className={`text-sm font-medium ${
                    sortBy === "status" ? "text-brand" : "text-gray-500 hover:text-brand"
                  }`}
                >
                  Status
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-sm font-medium text-red-600 hover:text-red-700 ml-4"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:space-x-4">
                {/* View Toggle */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">View:</span>
                  <div className="flex border border-gray-300 rounded-md">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 ${
                        viewMode === "grid" 
                          ? "bg-brand text-white" 
                          : "bg-white text-gray-500 hover:text-brand"
                      }`}
                    >
                      <Grid3X3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 ${
                        viewMode === "list" 
                          ? "bg-brand text-white" 
                          : "bg-white text-gray-500 hover:text-brand"
                      }`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500">
                  Showing {totalItems > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + paginatedApplications.length, totalItems)} of {totalItems} applications
                </div>
              </div>
            </div>
          </div>



          {/* Applications Display */}
          {isLoading ? (
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
              : "space-y-4"
            }>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
                  <div className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-20" />
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-3 bg-gray-200 rounded" />
                      <div className="h-3 bg-gray-200 rounded w-3/4" />
                    </div>
                    <div className="h-8 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : paginatedApplications.length > 0 ? (
            <>
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
                : "space-y-4"
              }>
                {paginatedApplications.map((application) => (
                  <ApplicationCard
                    key={application.id}
                    application={application}
                    onRequestAccess={handleRequestAccessForApplication}
                    viewMode={viewMode}
                  />
                ))}
              </div>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:space-x-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-full sm:w-auto"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(totalPages)].map((_, index) => {
                      const page = index + 1;
                      // Show first page, last page, current page, and pages around current
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 rounded-md text-sm ${
                              currentPage === page
                                ? "bg-brand text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any applications matching your search criteria.
              </p>
              <Button
                onClick={() => handleRequestAccess()}
                className="bg-brand hover:bg-brand-dark w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit an Application Request
              </Button>
            </div>
          )}
        </div>
      </section>

      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
      />

      <RequestAccessModal
        isOpen={isRequestAccessModalOpen}
        onClose={() => {
          setIsRequestAccessModalOpen(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
      />
    </div>
  );
}
