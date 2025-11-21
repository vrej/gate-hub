import { useState, useMemo, useEffect } from "react";
import AppShell from "@/components/layout/app-shell";
import RequestsTable from "@/components/dashboard/requests-table";
import { useRequests } from "@/hooks/use-excel";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ApproveRequests() {
  const { data: requests, isLoading: isLoadingRequests } = useRequests();
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending"); // Default to pending requests
  
  // Filter requests based on search and status
  const filteredRequests = useMemo(() => {
    if (!requests) return [];
    
    return requests.filter(req => {
      const matchesSearch = searchQuery === "" || 
        req.applicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        req.justification.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesStatus = statusFilter === "" || req.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchQuery, statusFilter]);
  
  return (
    <AppShell 
      title="Approve Requests" 
      subtitle="Review and approve application requests"
    >
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 max-w-md mt-6">
        <Input
          placeholder="Search requests..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        <Select onValueChange={setStatusFilter} value={statusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="mt-8">
        {isLoadingRequests || isLoadingUsers ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <RequestsTable 
            requests={filteredRequests}
            users={users || []}
            showActions={true}
          />
        )}
      </div>
    </AppShell>
  );
}
