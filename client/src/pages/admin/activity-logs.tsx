import { useState, useMemo } from "react";
import AppShell from "@/components/layout/app-shell";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ActivityLog, User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Search, Calendar, Filter, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ActivityLogs() {
  const { data: logs, isLoading: isLoadingLogs } = useQuery<ActivityLog[]>({
    queryKey: ["/api/activity-logs"],
  });
  
  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  
  // Get unique actions from logs
  const actions = useMemo(() => {
    if (!logs) return [];
    const allActions = logs.map(log => log.action);
    return [...new Set(allActions)];
  }, [logs]);
  
  // Filter logs based on search, action, and user
  const filteredLogs = useMemo(() => {
    if (!logs || !users) return [];
    
    return logs.filter(log => {
      // Find the user name for display
      const user = users.find(u => u.id === log.userId);
      const userName = user ? `${user.firstName} ${user.lastName}` : `User #${log.userId}`;
      
      const matchesSearch = searchQuery === "" || 
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        userName.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesAction = actionFilter === "" || log.action === actionFilter;
      const matchesUser = userFilter === "" || log.userId.toString() === userFilter;
      
      return matchesSearch && matchesAction && matchesUser;
    });
  }, [logs, users, searchQuery, actionFilter, userFilter]);
  
  // Get badge color based on action type
  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case "LOGIN":
      case "REGISTER":
        return "bg-blue-100 text-blue-800";
      case "CREATE_REQUEST":
        return "bg-yellow-100 text-yellow-800";
      case "UPDATE_REQUEST_STATUS":
        return "bg-green-100 text-green-800";
      case "LOGOUT":
        return "bg-neutral-100 text-neutral-800";
      case "SEND_INVITATIONS":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-neutral-100 text-neutral-800";
    }
  };
  
  const isLoading = isLoadingLogs || isLoadingUsers;
  
  return (
    <AppShell 
      title="Activity Logs" 
      subtitle="View system activity and audit history"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-6">
        <div className="relative max-w-md w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-neutral-medium" />
          </div>
          <Input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Date Range
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <div className="w-full sm:w-48">
          <Select onValueChange={setActionFilter} value={actionFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {actions.map(action => (
                <SelectItem key={action} value={action}>{action.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-48">
          <Select onValueChange={setUserFilter} value={userFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Users</SelectItem>
              {users?.map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="mt-8 bg-white shadow overflow-hidden rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-neutral-medium">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => {
                    // Find the user for displaying name
                    const user = users?.find(u => u.id === log.userId);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
                        </TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeClass(log.action)}>
                            {log.action.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-primary-light text-white flex items-center justify-center mr-2">
                              <span className="font-medium text-xs">
                                {user ? `${user.firstName[0]}${user.lastName[0]}` : <UserIcon className="h-4 w-4" />}
                              </span>
                            </div>
                            <span>
                              {user ? `${user.firstName} ${user.lastName}` : `User #${log.userId}`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {log.details}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
