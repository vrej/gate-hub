import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { PlusCircle, Upload, Database, Download, Edit, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import WhyBrandsLogo from '@/components/ui/why-brands-logo';
import { DEPARTMENTS } from '@shared/constants';

// Sample application data structure
interface Application {
  id: number;
  name: string;
  description: string;
  department: string;
  url: string;
  status: 'approved' | 'pending' | 'rejected';
  iconType?: string;
  approvedDepartments?: string[] | null;
}

interface ApplicationFormData {
  name: string;
  description: string;
  department: string;
  url: string;
  status: 'approved' | 'pending' | 'rejected';
  iconType?: string;
  approvedDepartments?: string[];
}

// Sample request data structure
interface Request {
  id: number;
  applicationName: string;
  requestedBy: number;
  requestedAt: string;
  justification: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState("applications");
  const [applications, setApplications] = useState<Application[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Application form state
  const [appForm, setAppForm] = useState<ApplicationFormData>({
    name: '',
    description: '',
    department: '',
    url: '',
    status: 'approved',
    approvedDepartments: []
  });

  // File upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  // CSV import handler
  const handleCsvImport = async () => {
    if (!csvFile) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    const formData = new FormData();
    formData.append('file', csvFile);
    
    try {
      const response = await fetch('/api/import-csv', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to import CSV');
      }
      
      const result = await response.json();
      
      toast({
        title: "Import successful",
        description: `Imported ${result.count} items`,
      });
      
      // Refresh data
      fetchApplications();
      
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch applications
  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/applications');
      if (!response.ok) {
        throw new Error('Failed to fetch applications');
      }
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      toast({
        title: "Error fetching applications",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch requests
  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/requests');
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      toast({
        title: "Error fetching requests",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add application
  const handleAddApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appForm.name || !appForm.description || !appForm.department || !appForm.url) {
      toast({
        title: "Validation error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      await apiRequest('POST', '/api/applications', appForm);
      
      toast({
        title: "Success",
        description: "Application added successfully",
      });
      
      // Reset form
      setAppForm({
        name: '',
        description: '',
        department: '',
        url: '',
        status: 'approved',
        approvedDepartments: []
      });
      
      // Refresh applications
      fetchApplications();
      
    } catch (error) {
      toast({
        title: "Error adding application",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete application
  const handleDeleteApplication = async (id: number) => {
    if (!confirm('Are you sure you want to delete this application?')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await apiRequest('DELETE', `/api/applications/${id}`);
      
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
      
      // Refresh applications
      fetchApplications();
      
    } catch (error) {
      toast({
        title: "Error deleting application",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update request status
  const handleUpdateRequestStatus = async (id: number, status: 'approved' | 'rejected') => {
    setIsLoading(true);
    
    try {
      await apiRequest('PATCH', `/api/requests/${id}`, { status });
      
      toast({
        title: "Success",
        description: `Request ${status}`,
      });
      
      // Refresh requests
      fetchRequests();
      
    } catch (error) {
      toast({
        title: "Error updating request",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Export to CSV
  const handleExport = async () => {
    try {
      const response = await fetch('/api/export-csv');
      if (!response.ok) {
        throw new Error('Failed to export data');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'applications.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export successful",
        description: "Data exported to CSV",
      });
      
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  // When tab changes, fetch appropriate data
  React.useEffect(() => {
    if (activeTab === "applications") {
      fetchApplications();
    } else if (activeTab === "requests") {
      fetchRequests();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <WhyBrandsLogo className="text-primary h-8 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">Admin Portal</h1>
          </div>
          <div>
            <Button 
              variant="outline" 
              className="mr-2"
              onClick={() => navigate('/admin/users')}
            >
              User Management
            </Button>
            <Button 
              variant="outline" 
              className="mr-2"
              onClick={() => navigate('/')}
            >
              View Portal
            </Button>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="applications">Applications</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="import">Import/Export</TabsTrigger>
          </TabsList>
          
          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Manage Applications</h3>
              <Button onClick={() => setActiveTab("add-application")}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Application
              </Button>
            </div>
            
            <div className="bg-white rounded-md shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                        No applications found. Add one or import from CSV.
                      </TableCell>
                    </TableRow>
                  ) : (
                    applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">{app.name}</TableCell>
                        <TableCell>{app.department}</TableCell>
                        <TableCell>
                          <a href={app.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {app.url}
                          </a>
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            app.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : app.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {app.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 mr-2">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-500"
                            onClick={() => handleDeleteApplication(app.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Add Application Tab */}
          <TabsContent value="add-application" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Add New Application</h3>
              <Button variant="outline" onClick={() => setActiveTab("applications")}>
                Back to Applications
              </Button>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Application Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddApplication} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Application Name *</Label>
                      <Input 
                        id="name" 
                        value={appForm.name}
                        onChange={(e) => setAppForm({...appForm, name: e.target.value})}
                        placeholder="Microsoft Teams"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department *</Label>
                      <Select 
                        value={appForm.department} 
                        onValueChange={(value) => setAppForm({...appForm, department: value})}
                      >
                        <SelectTrigger id="department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="url">URL *</Label>
                    <Input 
                      id="url" 
                      type="url"
                      value={appForm.url}
                      onChange={(e) => setAppForm({...appForm, url: e.target.value})}
                      placeholder="https://teams.microsoft.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea 
                      id="description" 
                      value={appForm.description}
                      onChange={(e) => setAppForm({...appForm, description: e.target.value})}
                      placeholder="Team chat, meetings, calling, and collaboration in one place."
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        value={appForm.status} 
                        onValueChange={(value: 'approved' | 'pending' | 'rejected') => 
                          setAppForm({...appForm, status: value})
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="iconType">Icon Type (Optional)</Label>
                      <Input 
                        id="iconType" 
                        value={appForm.iconType || ''}
                        onChange={(e) => setAppForm({...appForm, iconType: e.target.value})}
                        placeholder="teams"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="approvedDepartments">Approved Departments</Label>
                    <div className="flex flex-wrap gap-2 border rounded-md p-3">
                      {DEPARTMENTS.map((dept) => (
                        <Button 
                          key={dept.id}
                          type="button" 
                          variant="outline" 
                          size="sm"
                          className={appForm.approvedDepartments?.includes(dept.id) ? 'bg-primary text-white' : ''}
                          onClick={() => {
                            const departments = [...(appForm.approvedDepartments || [])];
                            const index = departments.indexOf(dept.id);
                            if (index >= 0) {
                              departments.splice(index, 1);
                            } else {
                              departments.push(dept.id);
                            }
                            setAppForm({...appForm, approvedDepartments: departments});
                          }}
                        >
                          {dept.id}
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Select the departments that are approved to use this application.
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? "Adding..." : "Add Application"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            <h3 className="text-lg font-semibold">Manage Requests</h3>
            
            <div className="bg-white rounded-md shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Application</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Justification</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        No requests found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    requests.map((req) => (
                      <TableRow key={req.id}>
                        <TableCell className="font-medium">{req.applicationName}</TableCell>
                        <TableCell>User #{req.requestedBy}</TableCell>
                        <TableCell>{new Date(req.requestedAt).toLocaleDateString()}</TableCell>
                        <TableCell className="max-w-xs truncate" title={req.justification}>
                          {req.justification}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            req.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : req.status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {req.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-green-600 mr-1"
                                onClick={() => handleUpdateRequestStatus(req.id, 'approved')}
                              >
                                Approve
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 px-2 text-red-600"
                                onClick={() => handleUpdateRequestStatus(req.id, 'rejected')}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          {/* Import/Export Tab */}
          <TabsContent value="import" className="space-y-6">
            <h3 className="text-lg font-semibold">Import & Export Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Import Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Upload className="mr-2 h-5 w-5" /> Import from CSV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="csv-file">Select CSV File</Label>
                      <Input 
                        id="csv-file" 
                        type="file" 
                        accept=".csv" 
                        onChange={handleFileChange}
                      />
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>CSV should contain columns for:</p>
                      <ul className="list-disc pl-5 mt-1">
                        <li>name</li>
                        <li>description</li>
                        <li>department</li>
                        <li>url</li>
                        <li>status (approved, pending, rejected)</li>
                        <li>iconType (optional)</li>
                      </ul>
                    </div>
                    <Button onClick={handleCsvImport} disabled={!csvFile || isLoading} className="w-full">
                      {isLoading ? "Importing..." : "Import Data"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Export Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="mr-2 h-5 w-5" /> Export to CSV
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Export Options</Label>
                      <Select defaultValue="applications">
                        <SelectTrigger>
                          <SelectValue placeholder="Select data to export" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="applications">Applications</SelectItem>
                          <SelectItem value="requests">Requests</SelectItem>
                          <SelectItem value="all">All Data</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>This will export all data in the selected department to a CSV file that you can download and edit.</p>
                    </div>
                    <Button onClick={handleExport} className="w-full">
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Database Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="mr-2 h-5 w-5" /> Database Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                    <h4 className="font-semibold text-yellow-800">Warning</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      These actions will permanently modify your database. Use with caution.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full">
                      Clear Applications
                    </Button>
                    <Button variant="outline" className="w-full">
                      Clear Requests
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminPanel;