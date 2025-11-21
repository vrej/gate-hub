import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, AlertCircle, Filter, Calendar, X, Check, Clock, Trash2, CheckSquare, Square } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ErrorLog {
  id: number;
  level: string;
  message: string;
  stack?: string;
  context?: string;
  userId?: number;
  requestId?: string;
  metadata?: any;
  addressed: boolean;
  addressedBy?: number;
  addressedAt?: string;
  createdAt: string;
}

interface ErrorLogsStats {
  totalErrors: number;
  todayErrors: number;
  unaddressedErrors: number;
  addressedErrors: number;
  errorsByLevel: { level: string; count: number }[];
  errorsByContext: { context: string; count: number }[];
}

export default function ErrorLogsModalSimple() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  const { toast } = useToast();

  // Build query parameters
  const queryParams = new URLSearchParams();
  if (selectedLevel && selectedLevel !== "all") queryParams.append("level", selectedLevel);
  if (selectedStatus && selectedStatus !== "all") {
    queryParams.append("addressed", selectedStatus === "addressed" ? "true" : "false");
  }
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  queryParams.append("limit", "50");

  const { data: errorLogs = [], isLoading, error } = useQuery<ErrorLog[]>({
    queryKey: ["/api/error-logs", queryParams.toString()],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/error-logs?${queryParams.toString()}`);
      return response.json();
    },
    retry: 1,
  });

  const { data: stats } = useQuery<ErrorLogsStats>({
    queryKey: ["/api/error-logs/stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/error-logs/stats");
      return response.json();
    },
  });

  // Mutation to update addressed status
  const updateAddressedMutation = useMutation({
    mutationFn: async ({ id, addressed }: { id: number; addressed: boolean }) => {
      console.log(`Updating error ${id} addressed status to:`, addressed);
      const response = await apiRequest("PUT", `/api/error-logs/${id}/addressed`, { addressed });
      const result = await response.json();
      console.log('Update response:', result);
      return result;
    },
    onSuccess: (data, variables) => {
      console.log('Successfully updated error log:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs/stats"] });
    },
    onError: (error) => {
      console.error('Failed to update error log:', error);
    },
  });

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      case "warn":
        return <AlertCircle className="h-3 w-3 text-yellow-500" />;
      case "info":
        return <Info className="h-3 w-3 text-blue-500" />;
      default:
        return <AlertTriangle className="h-3 w-3 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Delete mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/error-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs/stats"] });
      toast({
        title: "Success",
        description: "Error log deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete error log",
        variant: "destructive",
      });
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => apiRequest("POST", "/api/error-logs/batch-delete", { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs/stats"] });
      setSelectedIds([]);
      setShowDeleteSelectedDialog(false);
      toast({
        title: "Success",
        description: "Selected error logs deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete error logs",
        variant: "destructive",
      });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/error-logs/all"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/error-logs/stats"] });
      setShowDeleteAllDialog(false);
      toast({
        title: "Success",
        description: "All error logs deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete all error logs",
        variant: "destructive",
      });
    },
  });

  const clearFilters = () => {
    setSelectedLevel("all");
    setSelectedStatus("all");
    setStartDate("");
    setEndDate("");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === errorLogs.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(errorLogs.map(log => log.id));
    }
  };

  const toggleSelectLog = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 w-full">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-lg font-bold">{stats.totalErrors}</div>
                    <div className="text-xs text-gray-600">Total Errors</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <div>
                      <div className="text-sm font-semibold">{stats.todayErrors}</div>
                      <div className="text-xs text-gray-500">Today</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="text-lg font-bold">{stats.unaddressedErrors}</div>
                    <div className="text-xs text-gray-600">Unaddressed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="text-sm font-semibold">{stats.addressedErrors}</div>
                      <div className="text-xs text-gray-500">Fixed</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Info className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">By Level</div>
                    <div className="space-y-1">
                      {stats.errorsByLevel.slice(0, 2).map((item) => (
                        <div key={item.level} className="flex justify-between text-xs">
                          <span className="capitalize">{item.level}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Filter className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-xs font-medium text-gray-700 mb-1">Top Contexts</div>
                    <div className="space-y-1">
                      {stats.errorsByContext.slice(0, 2).map((item) => (
                        <div key={item.context} className="flex justify-between text-xs">
                          <span className="truncate">{item.context}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <Label htmlFor="level" className="text-xs">Level</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="All levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warn">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-xs">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="All status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unaddressed">Unaddressed</SelectItem>
                    <SelectItem value="addressed">Addressed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate" className="text-xs">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div>
                <Label htmlFor="endDate" className="text-xs">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8"
              >
                <X className="h-3 w-3 mr-1" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.length} selected
              </span>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteSelectedDialog(true)}
                disabled={batchDeleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}

          {/* Delete All Button */}
          {Array.isArray(errorLogs) && errorLogs.length > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setShowDeleteAllDialog(true)}
                disabled={deleteAllMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All Logs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Error Logs ({Array.isArray(errorLogs) ? errorLogs.length : 0})</CardTitle>
            {Array.isArray(errorLogs) && errorLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="text-xs h-7"
              >
                {selectedIds.length === errorLogs.length ? (
                  <>
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Deselect All
                  </>
                ) : (
                  <>
                    <Square className="h-3 w-3 mr-1" />
                    Select All
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500 text-sm">
              Error loading logs: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          ) : (
            <div className="w-full">
              {Array.isArray(errorLogs) && errorLogs.length > 0 ? (
                <div className="space-y-2 p-4">
                  {errorLogs.map((log) => (
                    <div key={log.id} className={`border rounded-lg p-3 hover:bg-gray-50 ${
                      log.addressed ? 'bg-green-50 border-green-200' : 'bg-white'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => toggleSelectLog(log.id)}
                          >
                            {selectedIds.includes(log.id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                          {getLevelIcon(log.level)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-xs text-gray-500 truncate">
                                {formatDate(log.createdAt)} • {log.context || 'N/A'}
                              </div>
                              {log.addressed ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                  <Check className="h-3 w-3 mr-1" />
                                  Fixed
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm font-medium truncate" title={log.message}>
                              {log.message}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Button
                            variant={log.addressed ? "outline" : "default"}
                            size="sm"
                            className={`text-xs h-6 px-2 ${log.addressed ? 'text-green-700' : ''}`}
                            onClick={() => {
                              console.log('Button clicked for error:', log.id, 'current addressed:', log.addressed);
                              updateAddressedMutation.mutate({ 
                                id: log.id, 
                                addressed: !log.addressed 
                              });
                            }}
                            disabled={updateAddressedMutation.isPending}
                          >
                            {updateAddressedMutation.isPending ? "..." : (log.addressed ? "Fixed" : "Mark Fixed")}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2"
                            onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                          >
                            {expandedRow === log.id ? "Hide" : "View"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-6 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => deleteMutation.mutate(log.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {expandedRow === log.id && (
                        <div className="mt-3 pt-3 border-t space-y-3">
                          <div>
                            <strong className="text-xs font-semibold">Message:</strong>
                            <div className="mt-1 text-xs bg-gray-50 p-2 rounded break-words">
                              {log.message}
                            </div>
                          </div>
                          
                          {log.stack && (
                            <div>
                              <strong className="text-xs font-semibold">Stack Trace:</strong>
                              <div className="mt-1 text-xs bg-gray-50 p-2 rounded font-mono whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                                {log.stack}
                              </div>
                            </div>
                          )}
                          
                          {log.metadata && (
                            <div>
                              <strong className="text-xs font-semibold">Metadata:</strong>
                              <div className="mt-1 text-xs bg-gray-50 p-2 rounded font-mono whitespace-pre-wrap break-all max-h-24 overflow-y-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row gap-2 text-xs">
                            <div><strong>Request ID:</strong> {log.requestId || "N/A"}</div>
                            <div><strong>User ID:</strong> {log.userId || "N/A"}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No error logs found.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Selected Dialog */}
      <AlertDialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Error Logs?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} error log(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={batchDeleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => batchDeleteMutation.mutate(selectedIds)}
              disabled={batchDeleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {batchDeleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Dialog */}
      <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Error Logs?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ALL error logs? This will permanently remove all error logs from the system. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAllMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAllMutation.mutate()}
              disabled={deleteAllMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAllMutation.isPending ? "Deleting..." : "Delete All"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
