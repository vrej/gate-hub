import { useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import RequestsTable from "@/components/dashboard/requests-table";
import RequestForm from "@/components/forms/request-form";
import { useRequests } from "@/hooks/use-excel";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Requests() {
  const { data: requests, isLoading } = useRequests();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
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
      title="My Requests" 
      subtitle="Track the status of your application requests"
    >
      <div className="md:flex md:items-center md:justify-between mt-6">
        <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 max-w-md">
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
          <Select onValueChange={setStatusFilter} value={statusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 md:mt-0">
          <RequestForm />
        </div>
      </div>
      
      <div className="mt-8">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <RequestsTable 
            requests={filteredRequests} 
            users={[user!]} // Since we're only viewing our own requests
          />
        )}
      </div>
    </AppShell>
  );
}
