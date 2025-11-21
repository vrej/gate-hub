import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Info, AlertCircle, Calendar, Filter, Download, Trash2, CheckSquare, Square } from "lucide-react";
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
  createdAt: string;
}

interface ErrorLogsStats {
  totalErrors: number;
  todayErrors: number;
  errorsByLevel: { level: string; count: number }[];
  errorsByContext: { context: string; count: number }[];
}

export default function ErrorLogsModal() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedContext, setSelectedContext] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Build query parameters
  const queryParams = new URLSearchParams();
  if (selectedLevel && selectedLevel !== "all") queryParams.append("level", selectedLevel);
  if (selectedContext && selectedContext !== "all") queryParams.append("context", selectedContext);
  if (startDate) queryParams.append("startDate", startDate);
  if (endDate) queryParams.append("endDate", endDate);
  queryParams.append("limit", "100");

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

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "warn":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case "error":
        return "bg-red-100 text-red-800 border-red-200";
      case "warn":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "info":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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

  const handleExport = () => {
    if (!Array.isArray(errorLogs) || errorLogs.length === 0) {
      return; // Don't export if no data
    }
    
    const csvContent = [
      ["Date", "Level", "Context", "Message", "User ID", "Request ID"].join(","),
      ...errorLogs.map(log => [
        formatDate(log.createdAt),
        log.level,
        log.context || "",
        `"${log.message.replace(/"/g, '""')}"`,
        log.userId || "",
        log.requestId || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `error-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.totalErrors}</div>
                  <div className="text-sm text-gray-600">Total Errors</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <div>
                  <div className="text-2xl font-bold">{stats.todayErrors}</div>
                  <div className="text-sm text-gray-600">Today</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">By Level</div>
                <div className="space-y-1">
                  {stats.errorsByLevel.slice(0, 3).map((item) => (
                    <div key={item.level} className="flex justify-between text-xs">
                      <span className="capitalize">{item.level}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Top Contexts</div>
                <div className="space-y-1">
                  {stats.errorsByContext.slice(0, 3).map((item) => (
                    <div key={item.context} className="flex justify-between text-xs">
                      <span className="truncate">{item.context}</span>
                      <span className="font-medium">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <Label htmlFor="level">Level</Label>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
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
              <Label htmlFor="context">Context</Label>
              <Select value={selectedContext} onValueChange={setSelectedContext}>
                <SelectTrigger>
                  <SelectValue placeholder="All contexts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contexts</SelectItem>
                  {stats?.errorsByContext.map((item) => (
                    <SelectItem key={item.context} value={item.context}>
                      {item.context}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button onClick={handleExport} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
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

      {/* Error Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Error Logs ({Array.isArray(errorLogs) ? errorLogs.length : 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs w-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={toggleSelectAll}
                      >
                        {selectedIds.length === errorLogs.length && errorLogs.length > 0 ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Level</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Context</TableHead>
                    <TableHead className="text-xs">Message</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">User</TableHead>
                    <TableHead className="text-xs">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {error && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-red-500">
                        Error loading logs: {error instanceof Error ? error.message : 'Unknown error'}
                      </TableCell>
                    </TableRow>
                  )}
                  {!error && Array.isArray(errorLogs) && errorLogs.map((log) => (
                    <>
                      <TableRow key={log.id} className="hover:bg-gray-50">
                        <TableCell className="p-2 w-10">
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
                        </TableCell>
                        <TableCell className="text-xs p-2">
                          <div className="truncate w-20 sm:w-auto">
                            {new Date(log.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="flex items-center">
                            {getLevelIcon(log.level)}
                            <span className="ml-1 text-xs hidden sm:inline">{log.level}</span>
                          </div>
                        </TableCell>
                        <TableCell className="p-2 hidden sm:table-cell">
                          <span className="text-xs truncate">
                            {log.context || "N/A"}
                          </span>
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="text-xs truncate" title={log.message}>
                            {log.message}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 hidden md:table-cell">
                          <span className="text-xs">
                            {log.userId || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="p-2">
                          <div className="flex gap-1">
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
                        </TableCell>
                      </TableRow>
                      {expandedRow === log.id && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-gray-50 p-3 sm:p-4">
                            <div className="space-y-3 w-full max-w-full">
                              <div className="w-full">
                                <strong className="text-sm font-semibold block mb-2">Full Message:</strong>
                                <div className="p-3 bg-white rounded border text-sm break-words w-full overflow-hidden">
                                  {log.message}
                                </div>
                              </div>
                              
                              {log.stack && (
                                <div className="w-full">
                                  <strong className="text-sm font-semibold block mb-2">Stack Trace:</strong>
                                  <div className="p-3 bg-white rounded border w-full overflow-hidden">
                                    <pre className="text-xs whitespace-pre-wrap break-all font-mono leading-relaxed overflow-hidden">
                                      {log.stack}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              
                              {log.metadata && (
                                <div className="w-full">
                                  <strong className="text-sm font-semibold block mb-2">Metadata:</strong>
                                  <div className="p-3 bg-white rounded border w-full overflow-hidden">
                                    <pre className="text-xs whitespace-pre-wrap break-all font-mono leading-relaxed overflow-hidden">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              
                              <div className="flex flex-col sm:flex-row gap-3 text-sm pt-3 border-t w-full">
                                <div className="flex-1 min-w-0">
                                  <strong className="block">Request ID:</strong> 
                                  <span className="text-gray-600 font-mono text-xs break-all">
                                    {log.requestId || "N/A"}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <strong className="block">User ID:</strong> 
                                  <span className="text-gray-600 text-xs">
                                    {log.userId || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  {!error && !isLoading && Array.isArray(errorLogs) && errorLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No error logs found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
