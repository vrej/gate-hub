import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import GateHubLogo from '@/components/ui/gatehub-logo';
import { 
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink, Filter, Search, AlertCircle } from 'lucide-react';

// Define application type
interface Application {
  id: number;
  name: string;
  description: string;
  department: string;
  url: string;
  status: string;
  iconType?: string;
  approvedDepartments?: string[] | null;
}

const Dashboard = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [filteredApps, setFilteredApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const { toast } = useToast();
  
  // Fetch applications from API
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await fetch('/api/applications');
        if (!response.ok) {
          throw new Error('Failed to fetch applications');
        }
        const data = await response.json();
        setApplications(data);
        setFilteredApps(data);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setError('Could not load applications. Please try again later.');
        toast({
          title: 'Error',
          description: 'Failed to load applications',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplications();
  }, [toast]);
  
  // Filter applications based on search and department
  useEffect(() => {
    if (!applications.length) return;
    
    let filtered = [...applications];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(app => 
        app.name.toLowerCase().includes(search) || 
        app.description.toLowerCase().includes(search)
      );
    }
    
    // Apply department filter
    if (departmentFilter && departmentFilter !== 'all') {
      filtered = filtered.filter(app => app.department === departmentFilter);
    }
    
    setFilteredApps(filtered);
  }, [searchTerm, departmentFilter, applications]);
  
  // Get unique departments for filter
  const departments = React.useMemo(() => {
    const uniqueDepartments = new Set(applications.map(app => app.department));
    return Array.from(uniqueDepartments);
  }, [applications]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <GateHubLogo className="text-primary h-8 mr-2" />
            <h1 className="text-xl font-semibold text-gray-900">GateHub</h1>
          </div>
          <div>
            <Button asChild variant="outline" className="mr-2">
              <Link href="/admin">Admin Panel</Link>
            </Button>
          </div>
        </div>
      </header>
      
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Applications Directory</h2>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search applications..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-full md:w-1/4">
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Applications Grid */}
          {error ? (
            <div className="bg-red-50 p-4 rounded-md flex items-center text-red-800 mb-6">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No applications found.</p>
              {(searchTerm || departmentFilter) && (
                <p className="mt-2 text-gray-400 text-sm">
                  Try adjusting your search or filter criteria.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApps.map((app) => (
                <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-2">
                    <CardTitle>{app.name}</CardTitle>
                    <CardDescription>{app.department}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-gray-600 text-sm line-clamp-3">{app.description}</p>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button variant="secondary" size="sm" asChild>
                      <a href={app.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                        Open <ExternalLink className="ml-1 h-3.5 w-3.5" />
                      </a>
                    </Button>
                    <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      {app.status}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;