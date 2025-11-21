import { Request, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  PieChart,
  Shield,
  BarChart,
  Zap,
  BookOpen,
  Globe,
  Clipboard,
  Coffee,
} from "lucide-react";
import { useUpdateRequestStatus } from "@/hooks/use-excel";

interface RequestsTableProps {
  requests: Request[];
  users: User[];
  showActions?: boolean;
}

export default function RequestsTable({ requests, users, showActions = false }: RequestsTableProps) {
  const updateRequestStatus = useUpdateRequestStatus();
  
  const getUserName = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };
  
  const getIconForDepartment = (department: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      Analytics: <BarChart className="h-5 w-5" />,
      Security: <Shield className="h-5 w-5" />,
      Productivity: <Zap className="h-5 w-5" />,
      Learning: <BookOpen className="h-5 w-5" />,
      Marketing: <Globe className="h-5 w-5" />,
      Development: <Clipboard className="h-5 w-5" />,
      Design: <FileText className="h-5 w-5" />,
      Other: <Coffee className="h-5 w-5" />,
      Default: <FileText className="h-5 w-5" />,
    };
    
    return iconMap[department] || iconMap.Default;
  };
  
  const getBackgroundColorForDepartment = (department: string) => {
    const bgMap: Record<string, string> = {
      Analytics: "bg-accent",
      Security: "bg-primary-dark",
      Productivity: "bg-primary-light",
      Learning: "bg-accent-light",
      Marketing: "bg-primary",
      Development: "bg-neutral-medium",
      Design: "bg-primary-light",
      Other: "bg-neutral-medium",
      Default: "bg-primary",
    };
    
    return bgMap[department] || bgMap.Default;
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-[#10B981]";
      case "pending":
        return "bg-yellow-100 text-[#F59E0B]";
      case "rejected":
        return "bg-red-100 text-[#EF4444]";
      default:
        return "bg-yellow-100 text-[#F59E0B]";
    }
  };
  
  const handleApprove = (requestId: number) => {
    updateRequestStatus.mutate({ id: requestId, status: "approved" });
  };
  
  const handleReject = (requestId: number) => {
    updateRequestStatus.mutate({ id: requestId, status: "rejected" });
  };
  
  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-neutral-lightest">
            <TableRow>
              <TableHead>Application</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Requested By</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No requests found
                </TableCell>
              </TableRow>
            ) : (
              requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-10 w-10 ${getBackgroundColorForDepartment(request.department)} rounded-md flex items-center justify-center text-white`}>
                        {getIconForDepartment(request.department)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-neutral-dark">{request.applicationName}</div>
                        <div className="text-xs text-neutral-medium">{request.justification.substring(0, 30)}...</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-neutral-dark">{request.department}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-neutral-dark">{getUserName(request.requestedBy)}</div>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-medium">
                    {format(new Date(request.requestedAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(request.status)}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {showActions && request.status === "pending" ? (
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-status-rejected"
                          onClick={() => handleReject(request.id)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-status-approved"
                          onClick={() => handleApprove(request.id)}
                        >
                          Approve
                        </Button>
                      </div>
                    ) : (
                      <Button variant="link" className="text-primary hover:text-primary-dark">
                        Details
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
