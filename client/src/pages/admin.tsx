import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, CheckCircle, Clock, Dock, Plus, Upload, UserCog, History, Eye, Building, Tags, File, Edit, Trash2, Download, X, Check, FileText, Sparkles, Loader2, Database, AlertTriangle, Monitor, HelpCircle, BarChart3 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { resolveIconUrl } from "@/lib/utils";
import ErrorLogsModalSimple from "@/components/error-logs-modal-simple";
import HeroBannerModal from "@/components/hero-banner-modal";
import HelpManagementModal from "@/components/help-management-modal";
import AnalyticsModal from "@/components/analytics-modal";

// Schema for adding new applications
const applicationSchema = z.object({
  name: z.string().min(1, "Application name is required"),
  description: z.string().optional(),
  url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  statusId: z.number().optional(),
  approvedDepartments: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  icon: z.string().optional(),
  hideFromPublic: z.boolean().optional().default(false),
});

// Schema for adding new departments
const departmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  description: z.string().min(1, "Description is required"),
});

// Schema for adding new categories
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

// Schema for adding new statuses
const statusSchema = z.object({
  name: z.string().min(1, "Status name is required"),
  description: z.string().optional(),
  color: z.string().optional(),
});

// Schema for admin forms (password validation handled dynamically)
const adminSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please enter a valid email"),
  password: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  department: z.string().min(1, "Department is required"),
});

type ApplicationForm = z.infer<typeof applicationSchema>;
type DepartmentForm = z.infer<typeof departmentSchema>;
type CategoryForm = z.infer<typeof categorySchema>;
type StatusForm = z.infer<typeof statusSchema>;
type AdminForm = z.infer<typeof adminSchema>;

export default function Admin() {
  const { toast } = useToast();
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const modalContentRef = useRef<HTMLDivElement>(null);
  
  // State for modals
  const [showAllRequests, setShowAllRequests] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [showErrorLogs, setShowErrorLogs] = useState(false);
  const [showManageApplications, setShowManageApplications] = useState(false);
  const [showManageDepartments, setShowManageDepartments] = useState(false);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [showManageStatuses, setShowManageStatuses] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showManageAdmins, setShowManageAdmins] = useState(false);
  const [showManageCSV, setShowManageCSV] = useState(false);
  const [showHeroBannerModal, setShowHeroBannerModal] = useState(false);
  const [showHelpManagementModal, setShowHelpManagementModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // State for editing
  const [isEditingApplication, setIsEditingApplication] = useState(false);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [isEditingAdmin, setIsEditingAdmin] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedStatus, setSelectedStatus] = useState<any>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [selectedHeroBanner, setSelectedHeroBanner] = useState<any>(null);
  const [selectedHelpContent, setSelectedHelpContent] = useState<any>(null);
  
  // State for file uploads
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [iconRemoved, setIconRemoved] = useState(false);
  
  // State for AI generation
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<{
    url?: string;
    description?: string;
    icon?: string;
  }>({});
  
  // Search and filter states for applications modal
  const [appSearchQuery, setAppSearchQuery] = useState("");
  const [appStatusFilter, setAppStatusFilter] = useState<string>("all");
  const [appDepartmentFilter, setAppDepartmentFilter] = useState<string>("all");
  const [hasIcon, setHasIcon] = useState("all");
  const [hasURL, setHasURL] = useState("all");
  const [hasCategories, setHasCategories] = useState("all");
  const [hasDescription, setHasDescription] = useState("all");
  const [hiddenFilter, setHiddenFilter] = useState("all");
  
  // Fetch data
  const { data: stats } = useQuery<{
    totalUsers: number;
    totalApplications: number;
    totalDepartments: number;
    pendingRequests: number;
    approvedToday: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: requests = [] } = useQuery<any[]>({
    queryKey: ["/api/requests"],
  });

  const { data: applications = [] } = useQuery<any[]>({
    queryKey: ["/api/applications?includeHidden=true"],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery<any[]>({
    queryKey: ["/api/categories"],
  });

  const { data: statuses = [], isLoading: statusesLoading, error: statusesError } = useQuery<any[]>({
    queryKey: ["/api/statuses"],
  });

  const { data: activityLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/activity-logs"],
  });

  const { data: errorLogsStats } = useQuery<{
    totalErrors: number;
    todayErrors: number;
    errorsByLevel: { level: string; count: number }[];
    errorsByContext: { context: string; count: number }[];
  }>({
    queryKey: ["/api/error-logs/stats"],
  });

  const { data: heroBannerData } = useQuery<any>({
    queryKey: ["/api/hero-banner/admin"],
  });

  const { data: helpContentData } = useQuery<any>({
    queryKey: ["/api/help-content/admin"],
  });

  // Filter applications based on search and filters
  const filteredApplications = applications.filter((app) => {
    const matchesSearch = app.name.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
                         (app.description ?? "").toLowerCase().includes(appSearchQuery.toLowerCase());
    
    const matchesStatus = appStatusFilter === "all" || app.status?.name === appStatusFilter;
    
    const matchesDepartment = appDepartmentFilter === "all" || 
                             (app.departments && app.departments.some((dept: any) => dept.id === parseInt(appDepartmentFilter)));

    // Has Icon filter
    const hasIconData = app.icon && app.icon.trim() !== "";
    const matchesIcon = hasIcon === "all" || 
                       (hasIcon === "yes" && hasIconData) || 
                       (hasIcon === "no" && !hasIconData);

    // Has URL filter
    const hasURLData = app.url && app.url.trim() !== "";
    const matchesURL = hasURL === "all" || 
                      (hasURL === "yes" && hasURLData) || 
                      (hasURL === "no" && !hasURLData);

    // Has Categories filter
    const hasCategoriesData = app.categories && app.categories.length > 0;
    const matchesCategories = hasCategories === "all" || 
                             (hasCategories === "yes" && hasCategoriesData) || 
                             (hasCategories === "no" && !hasCategoriesData);

    // Has Description filter
    const hasDescriptionData = app.description && app.description.trim() !== "";
    const matchesDescription = hasDescription === "all" || 
                              (hasDescription === "yes" && hasDescriptionData) || 
                              (hasDescription === "no" && !hasDescriptionData);

    // Hidden filter
    const isHidden = app.hideFromPublic === true;
    const matchesHidden = hiddenFilter === "all" ||
                         (hiddenFilter === "hidden" && isHidden) ||
                         (hiddenFilter === "visible" && !isHidden);
    
    return matchesSearch && matchesStatus && matchesDepartment && 
           matchesIcon && matchesURL && matchesCategories && matchesDescription && matchesHidden;
  });

  const { data: departments = [] } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  });

  // Form setup
  const applicationForm = useForm<ApplicationForm>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      description: "",
      url: "",
      statusId: 2, // Default to pending status
      approvedDepartments: [],
      categories: [],
    },
  });

  const departmentForm = useForm<DepartmentForm>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const categoryForm = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const statusForm = useForm<StatusForm>({
    resolver: zodResolver(statusSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "#3b82f6",
    },
  });

  const adminForm = useForm<AdminForm>({
    resolver: zodResolver(adminSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      department: "",
    },
  });

  // Mutations for CRUD operations
  const addApplicationMutation = useMutation({
    mutationFn: async (data: { applicationData: ApplicationForm; logoFile?: File }) => {
      if (data.logoFile) {
        const formData = new FormData();
        formData.append('logoFile', data.logoFile);
        formData.append('name', data.applicationData.name);
        formData.append('description', data.applicationData.description || '');
        formData.append('url', data.applicationData.url || '');
        formData.append('status', data.applicationData.status);
        formData.append('approvedDepartments', JSON.stringify(data.applicationData.approvedDepartments || []));
        formData.append('categories', JSON.stringify(data.applicationData.categories || []));
        formData.append('hideFromPublic', String(data.applicationData.hideFromPublic || false));
        return apiRequest("POST", "/api/applications", formData);
      } else {
        // Ensure all optional fields have default values
        const applicationData = {
          ...data.applicationData,
          description: data.applicationData.description || '',
          url: data.applicationData.url || '',
          approvedDepartments: data.applicationData.approvedDepartments || [],
          categories: data.applicationData.categories || [],
          hideFromPublic: data.applicationData.hideFromPublic || false,
        };
        return apiRequest("POST", "/api/applications", applicationData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications?includeHidden=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsEditingApplication(false);
      setSelectedApplication(null);
      setLogoFile(null);
      setLogoPreview(null);
      setIconRemoved(false);
      setAISuggestions({});
      applicationForm.reset();
      toast({
        title: "Success",
        description: "Application added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add application",
        variant: "destructive",
      });
    },
  });

  const updateApplicationMutation = useMutation({
    mutationFn: async (data: { id: number; applicationData: ApplicationForm; logoFile?: File; removeIcon?: boolean }) => {
      console.log('[DEBUG] updateApplicationMutation called with:', {
        id: data.id,
        removeIcon: data.removeIcon,
        iconValue: data.applicationData.icon,
        logoFile: data.logoFile ? 'present' : 'none'
      });
      
      if (data.logoFile) {
        const formData = new FormData();
        formData.append('logoFile', data.logoFile);
        formData.append('name', data.applicationData.name);
        formData.append('description', data.applicationData.description || '');
        formData.append('url', data.applicationData.url || '');
        formData.append('status', data.applicationData.status);
        formData.append('approvedDepartments', JSON.stringify(data.applicationData.approvedDepartments || []));
        formData.append('categories', JSON.stringify(data.applicationData.categories || []));
        formData.append('hideFromPublic', String(data.applicationData.hideFromPublic || false));
        formData.append('icon', data.removeIcon ? "" : (data.applicationData.icon || ""));
        return apiRequest("PUT", `/api/applications/${data.id}`, formData);
      } else {
        // Include icon field for removal or preservation
        const updateData = {
          ...data.applicationData,
          icon: data.removeIcon ? "" : data.applicationData.icon
        };
        return apiRequest("PUT", `/api/applications/${data.id}`, updateData);
      }
    },
    onSuccess: () => {
      console.log('[DEBUG] updateApplicationMutation onSuccess called');
      queryClient.invalidateQueries({ queryKey: ["/api/applications?includeHidden=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsEditingApplication(false);
      setSelectedApplication(null);
      setLogoFile(null);
      setLogoPreview(null);
      setIconRemoved(false);
      setAISuggestions({});
      applicationForm.reset();
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update application",
        variant: "destructive",
      });
    },
  });

  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/applications/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications?includeHidden=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete application",
        variant: "destructive",
      });
    },
  });

  const addDepartmentMutation = useMutation({
    mutationFn: (data: DepartmentForm) => {
      if (isEditingDepartment && selectedDepartment) {
        return apiRequest("PUT", `/api/departments/${selectedDepartment.id}`, data);
      } else {
        return apiRequest("POST", "/api/departments", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setIsEditingDepartment(false);
      setSelectedDepartment(null);
      departmentForm.reset();
      toast({
        title: "Success",
        description: isEditingDepartment ? "Department updated successfully" : "Department added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (isEditingDepartment ? "Failed to update department" : "Failed to add department"),
        variant: "destructive",
      });
    },
  });

  const deleteDepartmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/departments/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({
        title: "Success",
        description: "Department deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete department",
        variant: "destructive",
      });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: (data: CategoryForm) => {
      if (isEditingCategory && selectedCategory) {
        return apiRequest("PUT", `/api/categories/${selectedCategory.id}`, data);
      } else {
        return apiRequest("POST", "/api/categories", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsEditingCategory(false);
      setSelectedCategory(null);
      categoryForm.reset();
      toast({
        title: "Success",
        description: isEditingCategory ? "Category updated successfully" : "Category added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (isEditingCategory ? "Failed to update category" : "Failed to add category"),
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/categories/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete category",
        variant: "destructive",
      });
    },
  });

  const addStatusMutation = useMutation({
    mutationFn: (data: StatusForm) => {
      if (isEditingStatus && selectedStatus) {
        return apiRequest("PUT", `/api/statuses/${selectedStatus.id}`, data);
      } else {
        return apiRequest("POST", "/api/statuses", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/statuses"] });
      setIsEditingStatus(false);
      setSelectedStatus(null);
      statusForm.reset();
      toast({
        title: "Success",
        description: isEditingStatus ? "Status updated successfully" : "Status added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (isEditingStatus ? "Failed to update status" : "Failed to add status"),
        variant: "destructive",
      });
    },
  });

  const deleteStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/statuses/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/statuses"] });
      toast({
        title: "Success",
        description: "Status deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete status",
        variant: "destructive",
      });
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: (data: AdminForm) => {
      if (isEditingAdmin && selectedAdmin) {
        // For editing, validate password only if provided
        if (data.password && data.password.trim() !== "" && data.password.length < 6) {
          throw new Error("Password must be at least 6 characters if provided");
        }
        
        // Filter out empty password field when editing
        const { password, ...baseData } = data;
        const updateData = {
          ...baseData,
          isAdmin: true,
          ...(password && password.trim() !== "" ? { password } : {})
        };
        return apiRequest("PUT", `/api/users/${selectedAdmin.id}`, updateData);
      } else {
        // For creating, password is required
        if (!data.password || data.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        return apiRequest("POST", "/api/users", { ...data, isAdmin: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setIsEditingAdmin(false);
      setSelectedAdmin(null);
      adminForm.reset();
      toast({
        title: "Success",
        description: isEditingAdmin ? "Admin updated successfully" : "Admin added successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || (isEditingAdmin ? "Failed to update admin" : "Failed to create admin user"),
        variant: "destructive",
      });
    },
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Admin user deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete admin",
        variant: "destructive",
      });
    },
  });

  const uploadCsvMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('csvFile', file);
      const response = await apiRequest("POST", "/api/applications/upload-csv", formData);
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications?includeHidden=true"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setCsvFile(null);
      toast({
        title: "CSV Import Complete",
        description: data.message || "Applications imported successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "CSV Import Failed",
        description: error.message || "Failed to import CSV file",
        variant: "destructive",
      });
    },
  });

  const testAIMutation = useMutation({
    mutationFn: async (data: { appName: string }) => {
      console.log("=== FRONTEND AI TEST START ===");
      console.log("AI test called with data:", data);
      const response = await apiRequest("POST", "/api/test-ai-full", data);
      console.log("AI test raw response:", response);
      const responseData = await response.json();
      console.log("AI test parsed response:", responseData);
      console.log("=== FRONTEND AI TEST END ===");
      return responseData;
    },
    onSuccess: (data: any) => {
      console.log("=== FRONTEND AI TEST SUCCESS ===");
      console.log("Test data:", data);
      
      toast({
        title: "AI Test Results",
        description: `Raw: ${data.rawResponse?.substring(0, 100)}...\nParsed: ${JSON.stringify(data.parsedResponse)}`,
      });
    },
    onError: (error: any) => {
      console.error("=== FRONTEND AI TEST ERROR ===");
      console.error("AI test error:", error);
      toast({
        title: "AI Test Failed",
        description: error.message || "Failed to test AI service",
        variant: "destructive",
      });
    },
  });

  const generateIconMutation = useMutation({
    mutationFn: async (data: { appName: string; appUrl?: string }) => {
      console.log("=== FRONTEND ICON MUTATION START ===");
      console.log("Icon mutation called with data:", data);
      const response = await apiRequest("POST", "/api/applications/generate-icon", data);
      console.log("Icon mutation raw response:", response);
      const responseData = await response.json();
      console.log("Icon mutation parsed response:", responseData);
      console.log("=== FRONTEND ICON MUTATION END ===");
      return responseData;
    },
    onSuccess: (data: any) => {
      console.log("=== FRONTEND ICON SUCCESS HANDLER START ===");
      console.log("Received icon data:", data);
      
      if (data.success && data.iconUrl) {
        console.log("Setting icon URL suggestion:", data.iconUrl);
        setAISuggestions((prev: any) => ({ ...prev, icon: data.iconUrl }));
        toast({
          title: "Icon Generated",
          description: `AI found an icon URL: ${data.iconUrl}`,
        });
      } else {
        console.warn("Icon generation failed:", data.error);
        toast({
          title: "Icon Generation Failed",
          description: data.error || "Failed to generate icon URL",
          variant: "destructive",
        });
      }
      
      console.log("=== FRONTEND ICON SUCCESS HANDLER END ===");
    },
    onError: (error: any) => {
      console.error("=== FRONTEND ICON ERROR HANDLER ===");
      console.error("Icon generation error:", error);
      toast({
        title: "Icon Generation Failed",
        description: error.message || "Failed to generate icon URL",
        variant: "destructive",
      });
    },
  });

  const generateAIInfoMutation = useMutation({
    mutationFn: async (data: { appName: string; existingUrl?: string; existingDescription?: string }) => {
      console.log("=== FRONTEND AI MUTATION START ===");
      console.log("AI mutation called with data:", data);
      const response = await apiRequest("POST", "/api/applications/generate-info", data);
      console.log("AI mutation raw response:", response);
      const responseData = await response.json();
      console.log("AI mutation parsed response:", responseData);
      console.log("=== FRONTEND AI MUTATION END ===");
      return responseData;
    },
    onSuccess: (data: any) => {
      console.log("=== FRONTEND AI SUCCESS HANDLER START ===");
      console.log("Received AI data:", data);
      
      setIsGeneratingAI(false);

      // Inline suggestion state for each field
      setAISuggestions({
        url: undefined,
        description: undefined,
        icon: undefined,
      });

      // Validation feedback for each field
      const results = data.validationResults || {};
      console.log("Validation results:", results);
      let toastMsgs: string[] = [];

      // URL field
      const currentUrl = applicationForm.getValues("url");
      console.log("Current URL in form:", currentUrl);
      console.log("AI suggested URL:", data.url);
      
      if (data.url) {
        if (!currentUrl || currentUrl.trim() === "") {
          console.log("Setting URL in form:", data.url);
          applicationForm.setValue("url", data.url);
          toastMsgs.push("✓ URL generated");
        } else if (data.url !== currentUrl) {
          console.log("Setting URL suggestion:", data.url);
          setAISuggestions((prev: any) => ({ ...prev, url: data.url }));
          toastMsgs.push("AI suggested a better URL");
        } else if (results.urlValid) {
          toastMsgs.push("✓ URL validated");
        } else {
          toastMsgs.push("⚠️ Existing URL may not be valid");
        }
      } else {
        console.warn("No URL provided by AI");
        toastMsgs.push("⚠️ No URL generated");
      }
      
      if (results.urlExists === false) {
        toastMsgs.push("⚠️ Generated/validated URL may not be accessible");
      }

      // Description field
      const currentDesc = applicationForm.getValues("description");
      console.log("Current description in form:", currentDesc);
      console.log("AI suggested description:", data.description);
      
      if (data.description) {
        if (!currentDesc || currentDesc.trim() === "") {
          console.log("Setting description in form:", data.description);
          applicationForm.setValue("description", data.description);
          toastMsgs.push("✓ Description generated");
        } else if (data.description !== currentDesc) {
          console.log("Setting description suggestion:", data.description);
          setAISuggestions((prev: any) => ({ ...prev, description: data.description }));
          toastMsgs.push("AI suggested a better description");
        } else if (results.descriptionRelevant) {
          toastMsgs.push("✓ Description validated");
        } else {
          toastMsgs.push("⚠️ Existing description may not be relevant");
        }
      } else {
        console.warn("No description provided by AI");
        toastMsgs.push("⚠️ No description generated");
      }

      // Icon field
      const currentIcon = applicationForm.getValues("icon");
      console.log("Current icon in form:", currentIcon);
      console.log("AI suggested icon path:", data.iconPath);
      console.log("AI suggested icon URL:", data.iconUrl);
      
      if (data.iconPath) {
        // If we have a downloaded icon path, use it
        if (!currentIcon || currentIcon.trim() === "") {
          console.log("Setting icon in form:", data.iconPath);
          applicationForm.setValue("icon", data.iconPath);
          setLogoPreview(`${window.location.origin}${data.iconPath}`);
          setIconRemoved(false);
          toastMsgs.push("✓ Icon generated");
        } else if (data.iconPath !== currentIcon) {
          console.log("Setting icon suggestion:", data.iconPath);
          setAISuggestions((prev: any) => ({ ...prev, icon: data.iconPath }));
          toastMsgs.push("AI suggested a better icon");
        } else if (results.iconFound) {
          toastMsgs.push("✓ Icon validated");
        } else {
          toastMsgs.push("⚠️ Existing icon may not be valid");
        }
      } else if (data.iconUrl) {
        // If we have an icon URL but no downloaded path, suggest the URL
        console.log("Setting icon URL suggestion:", data.iconUrl);
        setAISuggestions((prev: any) => ({ ...prev, icon: data.iconUrl }));
        toastMsgs.push("AI suggested an icon URL (click Import to use it)");
      } else {
        console.warn("No icon provided by AI");
        toastMsgs.push("⚠️ No icon generated");
      }

      console.log("Toast messages:", toastMsgs);

      // Show a toast with all feedback
      toast({
        title: "AI Generation Results",
        description: toastMsgs.join("\n"),
      });
      
      console.log("=== FRONTEND AI SUCCESS HANDLER END ===");
    },
    onError: (error: any) => {
      console.error("=== FRONTEND AI ERROR HANDLER ===");
      console.error("AI generation error:", error);
      setIsGeneratingAI(false);
      toast({
        title: "AI Generation Failed",
        description: error.message || "Failed to generate application information",
        variant: "destructive",
      });
    },
  });

  const refreshIconsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/applications/refresh-icons");
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications?includeHidden=true"] });
      toast({
        title: "Icon Refresh Complete",
        description: data.message || "Icons refreshed successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Icon Refresh Failed",
        description: error.message || "Failed to refresh icons",
        variant: "destructive",
      });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("PUT", `/api/requests/${requestId}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      console.log('Approval mutation successful, invalidating cache...');
      
      // Remove the data from cache completely
      queryClient.removeQueries({ queryKey: ["/api/requests"] });
      queryClient.removeQueries({ queryKey: ["/api/stats"] });
      queryClient.removeQueries({ queryKey: ["/api/activity-logs"] });
      
      // Force immediate refetch with fresh data
      queryClient.refetchQueries({ queryKey: ["/api/requests"] });
      queryClient.refetchQueries({ queryKey: ["/api/stats"] });
      
      console.log('Cache removal and refetch completed');
      
      toast({
        title: "Success",
        description: "Request approved successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve request",
        variant: "destructive",
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("PUT", `/api/requests/${requestId}/reject`, {});
      return response.json();
    },
    onSuccess: () => {
      console.log('Rejection mutation successful, removing cache...');
      
      // Remove the data from cache completely
      queryClient.removeQueries({ queryKey: ["/api/requests"] });
      queryClient.removeQueries({ queryKey: ["/api/stats"] });
      queryClient.removeQueries({ queryKey: ["/api/activity-logs"] });
      
      // Force immediate refetch with fresh data
      queryClient.refetchQueries({ queryKey: ["/api/requests"] });
      queryClient.refetchQueries({ queryKey: ["/api/stats"] });
      
      console.log('Cache removal and refetch completed');
      
      toast({
        title: "Success",
        description: "Request rejected successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject request",
        variant: "destructive",
      });
    },
  });

  const pendingRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const response = await apiRequest("PUT", `/api/requests/${requestId}/pending`, {});
      return response.json();
    },
    onSuccess: () => {
      console.log('Pending mutation successful, removing cache...');
      
      // Remove the data from cache completely
      queryClient.removeQueries({ queryKey: ["/api/requests"] });
      queryClient.removeQueries({ queryKey: ["/api/stats"] });
      queryClient.removeQueries({ queryKey: ["/api/activity-logs"] });
      
      // Force immediate refetch with fresh data
      queryClient.refetchQueries({ queryKey: ["/api/requests"] });
      queryClient.refetchQueries({ queryKey: ["/api/stats"] });
      
      console.log('Cache removal and refetch completed');
      
      toast({
        title: "Success",
        description: "Request status reset to pending",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset request status",
        variant: "destructive",
      });
    },
  });

  // Helper function to scroll to top of modal
  const scrollToTopOfModal = () => {
    console.log('=== Attempting to scroll to top of modal ===');
    
    // First try using the ref if available
    if (modalContentRef.current) {
      console.log('Using modalContentRef to scroll');
      modalContentRef.current.scrollTop = 0;
      console.log('Scrolled using ref');
      return;
    }
    
    setTimeout(() => {
      console.log('Ref not available, trying selectors...');
      
      // Try multiple approaches to find and scroll the modal content
      const approaches = [
        {
          name: 'DialogContent with overflow-y-auto',
          selector: '[role="dialog"] .overflow-y-auto',
        },
        {
          name: 'Radix DialogContent',
          selector: '[data-radix-dialog-content]',
        },
        {
          name: 'Modal with max-h-90vh',
          selector: '.max-h-\\[90vh\\]',
        },
        {
          name: 'Any dialog content',
          selector: '[role="dialog"] > div',
        },
        {
          name: 'Dialog itself',
          selector: '[role="dialog"]',
        }
      ];
      
      let scrolled = false;
      
      for (const approach of approaches) {
        const element = document.querySelector(approach.selector);
        console.log(`Trying ${approach.name}:`, element);
        
        if (element && element.scrollHeight > element.clientHeight) {
          console.log(`Found scrollable element with ${approach.name}, scrolling...`);
          element.scrollTop = 0;
          scrolled = true;
          break;
        } else if (element) {
          console.log(`Found element with ${approach.name} but it's not scrollable`);
          // Try scrolling anyway
          element.scrollTop = 0;
          scrolled = true;
          break;
        }
      }
      
      if (!scrolled) {
        console.log('No scrollable element found, trying window scroll as last resort');
        window.scrollTo(0, 0);
      }
      
      console.log('=== Scroll attempt completed ===');
    }, 200); // Increased timeout slightly
  };

  // Handler functions
  const handleApplicationSubmit = (data: ApplicationForm) => {
    console.log('[DEBUG] handleApplicationSubmit called with:', {
      data,
      iconRemoved,
      isEditingApplication,
      selectedApplicationId: selectedApplication?.id
    });
    
    // Business rule: If no departments selected, force status to pending
    const hasDepartments = data.approvedDepartments && data.approvedDepartments.length > 0;
    const finalData = {
      ...data,
      status: hasDepartments ? data.status : "pending"
    };

    if (isEditingApplication && selectedApplication) {
      updateApplicationMutation.mutate({
        id: selectedApplication.id,
        applicationData: finalData,
        logoFile: logoFile || undefined,
        removeIcon: iconRemoved
      });
    } else {
      addApplicationMutation.mutate({
        applicationData: finalData,
        logoFile: logoFile || undefined
      });
    }
  };

  const handleDepartmentSubmit = (data: DepartmentForm) => {
    addDepartmentMutation.mutate(data);
  };

  const handleCategorySubmit = (data: CategoryForm) => {
    addCategoryMutation.mutate(data);
  };

  const handleStatusSubmit = (data: StatusForm) => {
    addStatusMutation.mutate(data);
  };

  const handleAdminSubmit = (data: AdminForm) => {
    createAdminMutation.mutate(data);
  };



  const handleTestAI = () => {
    console.log("=== AI TEST BUTTON CLICKED ===");
    
    const appName = applicationForm.getValues("name");
    console.log("App name from form:", appName);
    
    if (!appName || appName.trim() === "") {
      console.log("No app name provided, showing error toast");
      toast({
        title: "Application Name Required",
        description: "Please enter an application name before testing AI",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      appName: appName.trim(),
    };
    
    console.log("Test request data being sent to backend:", requestData);

    testAIMutation.mutate(requestData);
    console.log("=== AI TEST REQUEST SENT ===");
  };

  const handleGenerateIcon = () => {
    console.log("=== ICON GENERATION BUTTON CLICKED ===");
    
    const appName = applicationForm.getValues("name");
    console.log("App name from form:", appName);
    
    if (!appName || appName.trim() === "") {
      console.log("No app name provided, showing error toast");
      toast({
        title: "Application Name Required",
        description: "Please enter an application name before generating icon",
        variant: "destructive",
      });
      return;
    }

    const existingUrl = applicationForm.getValues("url");
    
    console.log("Existing URL from form:", existingUrl);

    const requestData = {
      appName: appName.trim(),
      appUrl: existingUrl && existingUrl.trim() !== "" ? existingUrl.trim() : undefined,
    };
    
    console.log("Icon request data being sent to backend:", requestData);

    generateIconMutation.mutate(requestData);
    console.log("=== ICON GENERATION REQUEST SENT ===");
  };

  const handleGenerateAIInfo = () => {
    console.log("=== AI GENERATION BUTTON CLICKED ===");
    
    const appName = applicationForm.getValues("name");
    console.log("App name from form:", appName);
    
    if (!appName || appName.trim() === "") {
      console.log("No app name provided, showing error toast");
      toast({
        title: "Application Name Required",
        description: "Please enter an application name before generating AI information",
        variant: "destructive",
      });
      return;
    }

    const existingUrl = applicationForm.getValues("url");
    const existingDescription = applicationForm.getValues("description");
    
    console.log("Existing URL from form:", existingUrl);
    console.log("Existing Description from form:", existingDescription);

    const requestData = {
      appName: appName.trim(),
      existingUrl: existingUrl && existingUrl.trim() !== "" ? existingUrl.trim() : undefined,
      existingDescription: existingDescription && existingDescription.trim() !== "" ? existingDescription.trim() : undefined,
    };
    
    console.log("Request data being sent to backend:", requestData);

    setIsGeneratingAI(true);
    generateAIInfoMutation.mutate(requestData);
    console.log("=== AI GENERATION REQUEST SENT ===");
  };

  const handleApproveRequest = (requestId: number) => {
    approveRequestMutation.mutate(requestId);
  };

  const handleRejectRequest = (requestId: number) => {
    rejectRequestMutation.mutate(requestId);
  };

  const handleStatusChange = (requestId: number, newStatus: string) => {
    try {
      console.log(`Status change requested: Request ${requestId} -> ${newStatus}`);
      
      // Make the actual API call - let the mutation handle cache updates
      if (newStatus === 'approved') {
        approveRequestMutation.mutate(requestId);
      } else if (newStatus === 'rejected') {
        rejectRequestMutation.mutate(requestId);
      } else if (newStatus === 'pending') {
        pendingRequestMutation.mutate(requestId);
      }
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
      toast({
        title: "Error",
        description: "Failed to change request status",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (!applications || applications.length === 0) {
      toast({
        title: "No Data",
        description: "No applications available to export",
        variant: "destructive",
      });
      return;
    }

    // Prepare comprehensive CSV headers
    const headers = [
      "ID",
      "Name", 
      "Description",
      "URL",
      "Icon URL",
      "Has Icon",
      "Status",
      "Approved Departments",
      "Categories",
      "Hide From Public",
      "Created Date",
      "Updated Date"
    ];

    // Prepare CSV rows with comprehensive data
    const rows = applications.map((app: any) => {
      // Determine if app has an icon
      const hasIcon = app.icon && app.icon.trim() !== '' ? 'Yes' : 'No';
      
      // Get icon URL - if it's a local path, we'll need to construct the full URL
      let iconUrl = '';
      if (app.icon && app.icon.trim() !== '') {
        if (app.icon.startsWith('/uploads/')) {
          // It's a local file, construct the full URL
          iconUrl = `${window.location.origin}${app.icon}`;
        } else if (app.icon.startsWith('http')) {
          // It's already a full URL
          iconUrl = app.icon;
        } else {
          // It's just a filename, construct the full URL
          iconUrl = `${window.location.origin}/uploads/${app.icon}`;
        }
      }

      // Format departments
      const departments = app.departments && app.departments.length > 0 
        ? app.departments.map((dept: any) => dept.name).join(', ')
        : 'All departments';

      // Format categories
      const categories = app.categories && app.categories.length > 0 
        ? app.categories.map((category: any) => category.name).join(', ')
        : '';

      return [
        app.id,
        `"${app.name}"`,
        `"${app.description?.replace(/"/g, '""') || ''}"`,
        app.url || '',
        iconUrl,
        hasIcon,
        app.status?.name || '',
        `"${departments}"`,
        `"${categories}"`,
        app.hideFromPublic ? 'Yes' : 'No',
        new Date(app.createdAt).toLocaleDateString(),
        new Date(app.updatedAt).toLocaleDateString()
      ];
    });

    // Create CSV content
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowManageCSV(false);
    toast({
      title: "Export Complete",
      description: `Successfully exported ${applications.length} applications to CSV with comprehensive data`,
    });
  };

  const handleImportIcon = async (iconUrl: string) => {
    try {
      console.log("Importing icon from:", iconUrl);
      
      // Set the icon URL directly in the form
      applicationForm.setValue("icon", iconUrl);
      setLogoPreview(iconUrl);
      setIconRemoved(false);
      
      // Clear the AI suggestion since we've used it
      setAISuggestions(prev => ({ ...prev, icon: undefined }));
      
      toast({
        title: "Icon Imported",
        description: "Icon URL has been imported into the form. You can now save the application.",
      });
    } catch (error) {
      console.error("Failed to import icon:", error);
      toast({
        title: "Icon Import Failed",
        description: "Failed to import the icon URL. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Migration mutation
  const migrationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/migrate-schema');
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Migration completed successfully!",
        description: `Migrated ${data.summary.migratedApps} applications, skipped ${data.summary.skippedApps}. The IT/IT-test issue should now be resolved.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
    },
    onError: (error: any) => {
      toast({
        title: "Migration failed",
        description: error.message || "An error occurred during the migration.",
        variant: "destructive",
      });
    },
  });

  const handleRunMigration = () => {
    if (confirm("This will migrate the database schema to fix the IT/IT-test issue. This action cannot be undone. Continue?")) {
      migrationMutation.mutate();
    }
  };

  // Get current user from auth hook (disabled for testing)
  const { user: currentUser, isLoading } = useAuth();
  
  // AUTHENTICATION DISABLED FOR TESTING - Allow access without login
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand" />
  //         <p className="text-gray-600">Loading admin panel...</p>
  //       </div>
  //     </div>
  //   );
  // }

  // if (!currentUser || !currentUser.isAdmin) {
  //   return (
  //     <div className="min-h-screen bg-background flex items-center justify-center">
  //       <div className="text-center">
  //         <UserCog className="h-8 w-8 mx-auto mb-4 text-gray-400" />
  //         <p className="text-gray-600 mb-2">Access Denied</p>
  //         <p className="text-sm text-gray-500">You must be an admin to view this page.</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div style={{
      background: 'linear-gradient(145deg, #f0f4f8 0%, #e8eef5 100%)',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <Navigation showUserMenu={true} user={currentUser} />
      
      {/* Admin Dashboard */}
      <section style={{ padding: '32px' }}>
        <div className="max-w-7xl mx-auto">
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '28px',
              fontWeight: 600,
              color: '#4a5568',
              margin: 0
            }}>
              ADMIN DASHBOARD
            </h2>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              color: '#a0aec0',
              marginTop: '8px',
              marginBottom: 0
            }}>
              Manage applications, users, and access requests across the organization.
            </p>
          </div>

          {/* Admin Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6" style={{ marginBottom: '32px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
                border: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(163, 230, 53, 0.15)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Users style={{ width: '24px', height: '24px', color: '#A3E635' }} />
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#4a5568' }}>{stats.totalUsers}</div>
                    <div style={{ fontSize: '14px', color: '#a0aec0' }}>Total Users</div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
                border: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(163, 230, 53, 0.15)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle style={{ width: '24px', height: '24px', color: '#A3E635' }} />
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#4a5568' }}>{stats.approvedToday}</div>
                    <div style={{ fontSize: '14px', color: '#a0aec0' }}>Approved Today</div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
                border: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(163, 230, 53, 0.15)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Clock style={{ width: '24px', height: '24px', color: '#A3E635' }} />
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#4a5568' }}>{stats.pendingRequests}</div>
                    <div style={{ fontSize: '14px', color: '#a0aec0' }}>Pending Requests</div>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
                border: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'rgba(163, 230, 53, 0.15)',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Dock style={{ width: '24px', height: '24px', color: '#A3E635' }} />
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: '#4a5568' }}>{stats.totalApplications}</div>
                    <div style={{ fontSize: '14px', color: '#a0aec0' }}>Total Applications</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" style={{ marginBottom: '32px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Dock style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Applications</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Add new applications and manage existing ones
              </p>
              <button
                onClick={() => {
                  setShowManageApplications(true);
                  scrollToTopOfModal();
                }}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Plus className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                Manage Applications
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Building style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Departments</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Manage organizational departments
              </p>
              <button
                onClick={() => setShowManageDepartments(true)}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Plus className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                Manage Departments
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Tags style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Categories</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Organize applications by categories
              </p>
              <button
                onClick={() => setShowManageCategories(true)}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Plus className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                Manage Categories
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Application Statuses</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Manage application approval statuses
              </p>
              <button
                onClick={() => setShowManageStatuses(true)}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Plus className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                Manage Statuses
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <UserCog style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Admin Users</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Manage admin accounts and permissions
              </p>
              <button
                onClick={() => setShowManageAdmins(true)}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <UserCog className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                Manage Admins
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Eye style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>View Requests</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Review all access requests
              </p>
              <button
                onClick={() => setShowAllRequests(true)}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Eye className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                View All Requests
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <File style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>CSV Management</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Import/export applications via CSV
              </p>
              <button
                onClick={() => setShowManageCSV(true)}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Upload className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                Manage CSV
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Database style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Database Migration</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Fix IT/IT-test issue by migrating to new schema
              </p>
              <button
                onClick={handleRunMigration}
                disabled={migrationMutation.isPending}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0,
                  opacity: migrationMutation.isPending ? 0.5 : 1
                }}
              >
                {migrationMutation.isPending ? (
                  <Loader2 className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Database className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                )}
                {migrationMutation.isPending ? "Running Migration..." : "Run Schema Migration"}
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <AlertTriangle style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Error Logs</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                View and manage system error logs ({errorLogsStats?.totalErrors || 0} total)
              </p>
              <button
                onClick={() => setShowErrorLogs(true)}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <AlertTriangle className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                View Error Logs
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <Monitor style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Hero Banner</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Customize the hero banner content on the main page
              </p>
              <button
                onClick={() => {
                  const activeBanner = heroBannerData?.find((banner: any) => banner.isActive) || heroBannerData?.[0];
                  setSelectedHeroBanner(activeBanner);
                  setShowHeroBannerModal(true);
                }}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Edit className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                Edit Hero Banner
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <HelpCircle style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Help Content</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                Manage the help content displayed in the help modal
              </p>
              <button
                onClick={() => {
                  const activeHelpContent = helpContentData?.find((content: any) => content.isActive) || helpContentData?.[0];
                  setSelectedHelpContent(activeHelpContent);
                  setShowHelpManagementModal(true);
                }}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <Edit className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                Edit Help Content
              </button>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
              border: 'none'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                <BarChart3 style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Analytics</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 400, color: '#a0aec0', marginTop: '12px', marginBottom: '16px' }}>
                View traffic, engagement statistics and user activity trends
              </p>
              <button
                onClick={() => setShowAnalytics(true)}
                className="admin-action-btn"
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4a5568',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
              >
                <BarChart3 className="admin-action-icon" style={{ width: '16px', height: '16px', color: '#a0aec0', marginRight: '6px' }} />
                View Analytics
              </button>
            </div>
          </div>

          {/* Activity Logs */}
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
            border: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
              <History style={{ width: '20px', height: '20px', color: '#A3E635', marginRight: '8px' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4a5568' }}>Recent Activity</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activityLogs.length > 0 ? (
                <>
                  {activityLogs.slice(0, 5).map((log: any) => (
                    <div key={log.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 500, color: '#4a5568' }}>
                          {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#a0aec0', marginTop: '4px' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <span style={{
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '12px',
                        color: '#4a5568',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        background: 'rgba(163, 230, 53, 0.15)'
                      }}>
                        {log.entityType}
                      </span>
                    </div>
                  ))}
                  <div style={{ paddingTop: '8px' }}>
                    <button 
                      onClick={() => setShowAllLogs(true)}
                      className="view-all-btn"
                      style={{
                        background: 'transparent',
                        border: '2px solid #A3E635',
                        borderRadius: '12px',
                        padding: '10px 20px',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#4a5568',
                        cursor: 'pointer',
                        width: '100%'
                      }}
                    >
                      View All Activity
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#a0aec0' }}>No recent activity</span>
                  <button 
                    onClick={() => setShowAllLogs(true)}
                    className="view-all-btn"
                    style={{
                      background: 'transparent',
                      border: '2px solid #A3E635',
                      borderRadius: '12px',
                      padding: '10px 20px',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#4a5568',
                      cursor: 'pointer'
                    }}
                  >
                    View All
                  </button>
                  </div>
                )}
              </div>
            </div>
        </div>
      </section>

      {/* Manage Applications Modal */}
      <Dialog open={showManageApplications} onOpenChange={(open) => {
        setShowManageApplications(open);
        if (!open) {
          setIsEditingApplication(false);
          setSelectedApplication(null);
          applicationForm.reset();
          setLogoFile(null);
          setLogoPreview(null);
          setIconRemoved(false);
          setAISuggestions({});
          // Reset search and filters
          setAppSearchQuery("");
          setAppStatusFilter("all");
          setAppDepartmentFilter("all");
          setHasIcon("all");
          setHasURL("all");
          setHasCategories("all");
          setHasDescription("all");
          setHiddenFilter("all");
        }
      }}>
        <DialogContent ref={modalContentRef} className="manage-apps-modal-content max-w-[98vw] sm:max-w-6xl lg:max-w-7xl max-h-[90vh] overflow-y-auto modal-scrollbar">
          <DialogHeader className="pb-0 mb-6">
            <DialogTitle className="manage-apps-modal-title">
              {isEditingApplication ? "Edit Application" : "Manage Applications"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-0">
            {/* Add Application Form */}
            <div className="manage-apps-section-card">
              <h3 className="manage-apps-section-title">
                {isEditingApplication ? "Edit Application" : "Add New Application"}
              </h3>
              <div>
                <form onSubmit={applicationForm.handleSubmit(handleApplicationSubmit)} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="name" className="manage-apps-label">Application Name</label>
                      <div className="flex gap-2">
                        <input
                          id="name"
                          placeholder="e.g., Slack, Microsoft Teams"
                          className="manage-apps-input flex-1"
                          {...applicationForm.register("name")}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            console.log("Button clicked, calling AI generation...");
                            handleGenerateAIInfo();
                          }}

                          disabled={isGeneratingAI || generateAIInfoMutation.isPending}
                          className="manage-apps-icon-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Generate URL and description with AI"
                        >
                          {isGeneratingAI || generateAIInfoMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            console.log("Test button clicked, calling AI test...");
                            handleTestAI();
                          }}
                          disabled={testAIMutation.isPending}
                          className="manage-apps-icon-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Test AI service"
                        >
                          {testAIMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <span className="text-sm">🧪</span>
                          )}
                        </button>
                      </div>
                      {applicationForm.formState.errors.name && (
                        <p className="manage-apps-error-text mt-1">{applicationForm.formState.errors.name.message}</p>
                      )}
                      <p className="manage-apps-ai-link mt-2">
                        ✨ Generate URL & description | ✨ Generate icon URL | 🧪 Test AI
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="url" className="manage-apps-label">Application URL (Optional)</label>
                      <input
                        id="url"
                        placeholder="https://example.com (optional)"
                        className="manage-apps-input w-full"
                        {...applicationForm.register("url")}
                      />
                      {applicationForm.formState.errors.url && (
                        <p className="manage-apps-error-text mt-1">{applicationForm.formState.errors.url.message}</p>
                      )}
                      {aiSuggestions.url && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="manage-apps-ai-link">AI suggests: {aiSuggestions.url}</p>
                          <button
                            type="button"
                            className="manage-apps-icon-btn text-xs px-2"
                            onClick={() => {
                              applicationForm.setValue("url", aiSuggestions.url!);
                              setAISuggestions(prev => ({ ...prev, url: undefined }));
                            }}
                          >
                            Use
                          </button>
                          <button
                            type="button"
                            className="manage-apps-icon-btn text-xs px-2"
                            onClick={() => setAISuggestions(prev => ({ ...prev, url: undefined }))}
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <label htmlFor="status" className="manage-apps-label">Status</label>
                      <Select 
                        value={applicationForm.watch("statusId")?.toString()} 
                        onValueChange={(value) => applicationForm.setValue("statusId", parseInt(value))}
                      >
                        <SelectTrigger className="manage-apps-input cursor-pointer">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statuses.map((status: any) => (
                            <SelectItem 
                              key={status.id} 
                              value={status.id.toString()}
                              disabled={status.name === 'approved' && !applicationForm.watch("approvedDepartments")?.length}
                            >
                              <div className="flex items-center gap-2">
                                <span 
                                  className="w-2 h-2 rounded-full inline-block" 
                                  style={{ backgroundColor: status.color }}
                                ></span>
                                <span>
                                  {status.name.charAt(0).toUpperCase() + status.name.slice(1)}
                                </span>
                              </div>
                              {status.name === 'approved' && !applicationForm.watch("approvedDepartments")?.length && (
                                <span className="text-xs text-amber-600"> (requires departments)</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {applicationForm.formState.errors.statusId && (
                        <p className="manage-apps-error-text mt-1">{applicationForm.formState.errors.statusId.message}</p>
                      )}
                      {!applicationForm.watch("approvedDepartments")?.length && applicationForm.watch("statusId") === 1 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Applications without departments will be set to "Pending Review"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="description" className="manage-apps-label">Description (Optional)</label>
                    <textarea
                      id="description"
                      placeholder="Brief description of the application (optional)"
                      className="manage-apps-input w-full resize-none"
                      rows={3}
                      {...applicationForm.register("description")}
                    />
                    {applicationForm.formState.errors.description && (
                      <p className="manage-apps-error-text mt-1">{applicationForm.formState.errors.description.message}</p>
                    )}
                    {aiSuggestions.description && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="manage-apps-ai-link">AI suggests: {aiSuggestions.description}</p>
                        <button
                          type="button"
                          className="manage-apps-icon-btn text-xs px-2"
                          onClick={() => {
                            applicationForm.setValue("description", aiSuggestions.description!);
                            setAISuggestions(prev => ({ ...prev, description: undefined }));
                          }}
                        >
                          Use
                        </button>
                        <button
                          type="button"
                          className="manage-apps-icon-btn text-xs px-2"
                          onClick={() => setAISuggestions(prev => ({ ...prev, description: undefined }))}
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="app-icon" className="manage-apps-label">Application Icon</label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            id="app-icon"
                            type="file"
                            accept="image/*"
                            className="block flex-1 text-sm text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border file:border-solid file:border-gray-200 file:text-sm file:font-medium file:bg-gradient-to-r file:from-gray-50 file:to-gray-100 file:text-gray-700 hover:file:border-green-400 file:cursor-pointer"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                // Validate file type
                                if (!file.type.startsWith('image/')) {
                                  toast({
                                    title: "Invalid File",
                                    description: "Please select an image file",
                                    variant: "destructive",
                                  });
                                  e.target.value = '';
                                  return;
                                }
                                
                                // Validate file size (max 2MB)
                                if (file.size > 2 * 1024 * 1024) {
                                  toast({
                                    title: "File Too Large",
                                    description: "Please select an image smaller than 2MB",
                                    variant: "destructive",
                                  });
                                  e.target.value = '';
                                  return;
                                }
                                
                                setLogoFile(file);
                                
                                // Create preview
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  setLogoPreview(event.target?.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              console.log("AI Icon button clicked, calling icon generation...");
                              handleGenerateIcon();
                            }}
                            disabled={generateIconMutation.isPending}
                            className="manage-apps-icon-btn disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                            title="Generate icon URL with AI"
                          >
                            {generateIconMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        {(logoPreview || (isEditingApplication && selectedApplication?.icon && !iconRemoved)) && (
                          <div className="flex items-center space-x-1">
                            <div className="w-6 h-6 rounded border overflow-hidden bg-gray-50 flex-shrink-0 flex items-center justify-center">
                              {logoPreview ? (
                                <img src={logoPreview} alt="Preview" className="w-full h-full object-cover" />
                              ) : isEditingApplication && selectedApplication?.icon && !iconRemoved ? (
                                <img 
                                  src={resolveIconUrl(selectedApplication.icon)} 
                                  alt="Current icon" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : null}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                console.log('[DEBUG] Remove icon button clicked');
                                setLogoFile(null);
                                setLogoPreview(null);
                                setIconRemoved(true);
                                // Always clear the icon field when removing
                                applicationForm.setValue("icon", "");
                                // Clear file input
                                const fileInput = document.getElementById('app-icon') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                                console.log('[DEBUG] Icon removed, iconRemoved set to true, icon field set to empty string');
                              }}
                              className="text-red-600 hover:text-red-700 h-5 px-1 text-xs"
                            >
                              ×
                            </Button>
                          </div>
                        )}
                        {aiSuggestions.icon && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-xs text-blue-600">
                              AI suggests: {aiSuggestions.icon.startsWith('http') ? 'Icon URL (click Import to use)' : 'Icon'}
                            </p>
                            {aiSuggestions.icon.startsWith('http') ? (
                              // If it's a URL, show import button
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-5 px-2 text-xs"
                                onClick={() => handleImportIcon(aiSuggestions.icon!)}
                              >
                                Import
                              </Button>
                            ) : (
                              // If it's a local path, show use button
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-5 px-2 text-xs"
                                onClick={() => {
                                  applicationForm.setValue("icon", aiSuggestions.icon!);
                                  setLogoPreview(`${window.location.origin}${aiSuggestions.icon}`);
                                  setIconRemoved(false);
                                  setAISuggestions(prev => ({ ...prev, icon: undefined }));
                                }}
                              >
                                Use
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-5 px-2 text-xs"
                              onClick={() => setAISuggestions(prev => ({ ...prev, icon: undefined }))}
                            >
                              ×
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <label className="manage-apps-label">
                          Approved Departments (Optional)
                          {applicationForm.watch("status") === "approved" && (
                            <span className="text-amber-600 ml-1">*</span>
                          )}
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            applicationForm.setValue("approvedDepartments", []);
                          }}
                          className="manage-apps-unselect-link"
                        >
                          Unselect All
                        </button>
                      </div>
                      <div className="space-y-1 max-h-24 overflow-y-auto manage-apps-input p-3 text-sm">
                        {departments.map((dept: any) => {
                          const approvedDepartments = applicationForm.watch("approvedDepartments") || [];
                          const isSelected = approvedDepartments.includes(dept.name);
                          
                          return (
                            <label key={dept.id} className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                value={dept.name}
                                className="manage-apps-checkbox w-4 h-4"
                                checked={isSelected}
                                onChange={(e) => {
                                  const currentDepts = applicationForm.getValues("approvedDepartments") || [];
                                  if (e.target.checked) {
                                    // Add the selected department to the list
                                    const newDepts = [...currentDepts, dept.name];
                                    applicationForm.setValue("approvedDepartments", newDepts);
                                  } else {
                                    // Remove the unselected department from the list
                                    const newDepts = currentDepts.filter(d => d !== dept.name);
                                    applicationForm.setValue("approvedDepartments", newDepts);
                                  }
                                }}
                              />
                              <span className="manage-apps-checkbox-label">{dept.name}</span>
                            </label>
                          );
                        })}
                      </div>
                      {applicationForm.formState.errors.approvedDepartments && (
                        <p className="text-xs text-red-600 mt-1">{applicationForm.formState.errors.approvedDepartments.message}</p>
                      )}
                      {applicationForm.watch("status") === "approved" && !applicationForm.watch("approvedDepartments")?.length && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ At least one department is required for approval
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="manage-apps-label">
                        Categories ({categories.length})
                        {categoriesLoading && " (Loading...)"}
                        {categoriesError && " (Error loading)"}
                      </label>
                      <div className="space-y-1 max-h-24 overflow-y-auto manage-apps-input p-3 text-sm">
                        {categoriesLoading ? (
                          <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#a0aec0' }}>Loading categories...</p>
                        ) : categoriesError ? (
                          <p className="manage-apps-error-text">Error loading categories</p>
                        ) : categories && categories.length > 0 ? (
                          categories.map((category: any) => {
                            const selectedCategories = applicationForm.watch("categories") || [];
                            
                            
                            return (
                              <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  value={category.name}
                                  className="manage-apps-checkbox w-4 h-4"
                                  checked={selectedCategories.includes(category.name)}
                                  onChange={(e) => {
                                    const currentCategories = applicationForm.getValues("categories") || [];
                                    if (e.target.checked) {
                                      applicationForm.setValue("categories", [...currentCategories, category.name]);
                                    } else {
                                      applicationForm.setValue("categories", currentCategories.filter(c => c !== category.name));
                                    }
                                  }}
                                />
                                <span className="manage-apps-checkbox-label">{category.name}</span>
                              </label>
                            );
                          })
                        ) : (
                          <p style={{ fontFamily: 'Inter', fontSize: '14px', color: '#a0aec0' }}>No categories available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hideFromPublic"
                      className="manage-apps-checkbox w-4 h-4"
                      checked={applicationForm.watch("hideFromPublic") || false}
                      onChange={(e) => applicationForm.setValue("hideFromPublic", e.target.checked)}
                    />
                    <label htmlFor="hideFromPublic" className="manage-apps-checkbox-label cursor-pointer">
                      Hide from front (only visible to admins)
                    </label>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingApplication(false);
                        setSelectedApplication(null);
                        applicationForm.reset();
                        setAISuggestions({});
                      }}
                      className="manage-apps-cancel-btn"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={addApplicationMutation.isPending || updateApplicationMutation.isPending}
                      className="manage-apps-submit-btn disabled:opacity-50"
                    >
                      {isEditingApplication ? 
                        (updateApplicationMutation.isPending ? "Updating..." : "Update") :
                        (addApplicationMutation.isPending ? "Adding..." : "Add Application")
                      }
                    </button>
                  </div>
                </form>
              </div>
            </div>
            
            {/* Search and Filters - Only show when not editing */}
            {!isEditingApplication && (
              <div className="manage-apps-section-card">
                {/* Single Row - Search and All Filters */}
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[160px]">
                    <label className="manage-apps-label">Search</label>
                    <input
                      placeholder="Search applications..."
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                      className="manage-apps-input w-full"
                    />
                  </div>
                  
                  <div className="min-w-[110px]">
                    <label className="manage-apps-label">Status</label>
                    <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                      <SelectTrigger className="manage-apps-input cursor-pointer">
                        <SelectValue placeholder="Status" />
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
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="min-w-[120px]">
                    <label className="manage-apps-label">Department</label>
                    <Select value={appDepartmentFilter} onValueChange={setAppDepartmentFilter}>
                      <SelectTrigger className="manage-apps-input cursor-pointer">
                        <SelectValue placeholder="Department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="min-w-[90px]">
                    <label className="manage-apps-label">Icon</label>
                    <Select value={hasIcon} onValueChange={setHasIcon}>
                      <SelectTrigger className="manage-apps-input cursor-pointer">
                        <SelectValue placeholder="Icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Apps</SelectItem>
                        <SelectItem value="yes">Has Icon</SelectItem>
                        <SelectItem value="no">No Icon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[85px]">
                    <label className="manage-apps-label">URL</label>
                    <Select value={hasURL} onValueChange={setHasURL}>
                      <SelectTrigger className="manage-apps-input cursor-pointer">
                        <SelectValue placeholder="URL" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Apps</SelectItem>
                        <SelectItem value="yes">Has URL</SelectItem>
                        <SelectItem value="no">No URL</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[110px]">
                    <label className="manage-apps-label">Categories</label>
                    <Select value={hasCategories} onValueChange={setHasCategories}>
                      <SelectTrigger className="manage-apps-input cursor-pointer">
                        <SelectValue placeholder="Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Apps</SelectItem>
                        <SelectItem value="yes">Has Categories</SelectItem>
                        <SelectItem value="no">No Categories</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[115px]">
                    <label className="manage-apps-label">Description</label>
                    <Select value={hasDescription} onValueChange={setHasDescription}>
                      <SelectTrigger className="manage-apps-input cursor-pointer">
                        <SelectValue placeholder="Description" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Apps</SelectItem>
                        <SelectItem value="yes">Has Description</SelectItem>
                        <SelectItem value="no">No Description</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[100px]">
                    <label className="manage-apps-label">Visibility</label>
                    <Select value={hiddenFilter} onValueChange={setHiddenFilter}>
                      <SelectTrigger className="manage-apps-input cursor-pointer">
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Apps</SelectItem>
                        <SelectItem value="visible">Visible</SelectItem>
                        <SelectItem value="hidden">Hidden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(appSearchQuery || appStatusFilter !== "all" || appDepartmentFilter !== "all" || 
                    hasIcon !== "all" || hasURL !== "all" || hasCategories !== "all" || hasDescription !== "all" || hiddenFilter !== "all") && (
                    <div className="flex flex-col justify-end">
                      <button
                        onClick={() => {
                          setAppSearchQuery("");
                          setAppStatusFilter("all");
                          setAppDepartmentFilter("all");
                          setHasIcon("all");
                          setHasURL("all");
                          setHasCategories("all");
                          setHasDescription("all");
                          setHiddenFilter("all");
                        }}
                        className="manage-apps-clear-btn flex items-center space-x-1"
                      >
                        <X className="h-3 w-3" />
                        <span>Clear</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Existing Applications List */}
            <div className="manage-apps-section-card" style={{ marginBottom: 0 }}>
              <h3 className="manage-apps-section-title">Current Applications ({filteredApplications.length})</h3>
              <div>
                <div className="overflow-x-auto rounded-lg" style={{ border: '1px solid #e8eef5' }}>
                  <div className="max-h-80 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">Icon</TableHead>
                          <TableHead className="min-w-[140px] max-w-[200px]">Name</TableHead>
                          <TableHead className="min-w-[120px] hidden md:table-cell">URL</TableHead>
                          <TableHead className="min-w-[80px]">Status</TableHead>
                          <TableHead className="min-w-[100px] hidden lg:table-cell">Departments</TableHead>
                          <TableHead className="min-w-[100px] hidden xl:table-cell">Categories</TableHead>
                          <TableHead className="min-w-[80px] hidden 2xl:table-cell">Created</TableHead>
                          <TableHead className="min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map((app: any) => (
                          <TableRow key={app.id}>
                            <TableCell className="w-10">
                              <div className="w-6 h-6 rounded border overflow-hidden bg-gray-50 flex items-center justify-center">
                                {app.icon ? (
                                  <img 
                                    src={resolveIconUrl(app.icon)} 
                                    alt={`${app.name} icon`}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <File className="h-4 w-4 text-gray-400" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[140px] max-w-[200px]">
                              <div>
                                <div className="font-medium text-sm truncate">{app.name}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[120px] block md:hidden">
                                  {app.description}
                                </div>
                                <div className="text-xs text-gray-500 truncate max-w-[160px] hidden md:block">
                                  {app.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[120px] hidden md:table-cell">
                              <a 
                                href={app.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-xs truncate max-w-[100px] block"
                                title={app.url}
                              >
                                {app.url}
                              </a>
                            </TableCell>
                            <TableCell className="min-w-[80px]">
                              {app.status?.description ? (
                                <TooltipProvider>
                                  <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                      <span className="inline-block cursor-help">
                                        <Badge 
                                          variant={
                                            app.status?.name === 'approved' ? 'default' : 
                                            app.status?.name === 'pending' ? 'secondary' : 
                                            'destructive'
                                          }
                                          className="text-xs"
                                          style={{ 
                                            backgroundColor: app.status?.color, 
                                            color: 'white',
                                            borderColor: app.status?.color 
                                          }}
                                        >
                                          {app.status?.name}
                                        </Badge>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="max-w-xs bg-gray-900 text-white border-gray-800">
                                      <div className="flex flex-col gap-1">
                                        <p className="font-semibold text-xs opacity-70">Status Description</p>
                                        <p className="text-sm">{app.status?.description || "No description available"}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <Badge 
                                  variant={
                                    app.status?.name === 'approved' ? 'default' : 
                                    app.status?.name === 'pending' ? 'secondary' : 
                                    'destructive'
                                  }
                                  className="text-xs"
                                  style={{ 
                                    backgroundColor: app.status?.color, 
                                    color: 'white',
                                    borderColor: app.status?.color 
                                  }}
                                >
                                  {app.status?.name}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="min-w-[100px] hidden lg:table-cell">
                              <div className="text-xs">
                                {app.departments?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {app.departments.slice(0, 1).map((dept: any) => (
                                      <Badge key={dept.id} variant="outline" className="text-xs px-1 py-0">
                                        {dept.name}
                                      </Badge>
                                    ))}
                                    {app.departments.length > 1 && (
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        +{app.departments.length - 1}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="min-w-[100px] hidden xl:table-cell">
                              <div className="text-xs">
                                {app.categories?.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {app.categories.slice(0, 1).map((cat: any) => (
                                      <Badge key={cat.id} variant="outline" className="text-xs px-1 py-0">
                                        {cat.name}
                                      </Badge>
                                    ))}
                                    {app.categories.length > 1 && (
                                      <Badge variant="outline" className="text-xs px-1 py-0">
                                        +{app.categories.length - 1}
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs hidden 2xl:table-cell min-w-[80px]">
                              {new Date(app.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="min-w-[100px]">
                              <div className="flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    // Handle edit functionality
                                    setSelectedApplication(app);
                                    setIsEditingApplication(true);
                                    
                                    // Handle approvedDepartments - extract names from department objects
                                    const approvedDepts = app.departments ? app.departments.map((dept: any) => dept.name) : [];
                                    
                                    // Handle categories - extract names from category objects
                                    const categoryNames = app.categories ? app.categories.map((cat: any) => cat.name) : [];
                                    

                                    
                                    // Reset form with the application data using setValue for better control
                                    applicationForm.reset();
                                    
                                    // Set each field individually to ensure proper form state update
                                    setTimeout(() => {
                                      applicationForm.setValue("name", app.name);
                                      applicationForm.setValue("description", app.description || "");
                                      applicationForm.setValue("url", app.url || "");
                                      applicationForm.setValue("statusId", app.statusId || 2);
                                      applicationForm.setValue("approvedDepartments", approvedDepts);
                                      applicationForm.setValue("categories", categoryNames);
                                      applicationForm.setValue("icon", app.icon || "");
                                      applicationForm.setValue("hideFromPublic", app.hideFromPublic || false);
                                      
                                    }, 0);
                                    
                                    // Reset logo state for editing
                                    setLogoFile(null);
                                    setLogoPreview(null);
                                    setIconRemoved(false);
                                    
                                    // Scroll to top of modal
                                    scrollToTopOfModal();
                                  }}
                                  className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
                                      deleteApplicationMutation.mutate(app.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                  disabled={deleteApplicationMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {filteredApplications.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8" style={{ fontFamily: 'Inter', fontSize: '14px', color: '#a0aec0' }}>
                              {applications.length === 0 ? "No applications found. Add your first application above." : "No applications match your search criteria."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Departments Modal */}
      <Dialog open={showManageDepartments} onOpenChange={(open) => {
        setShowManageDepartments(open);
        if (!open) {
          setIsEditingDepartment(false);
          setSelectedDepartment(null);
          departmentForm.reset();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingDepartment ? "Edit Department" : "Manage Departments"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add Department Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEditingDepartment ? "Edit Department" : "Add New Department"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={departmentForm.handleSubmit(handleDepartmentSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="dept-name">Department Name</Label>
                    <Input
                      id="dept-name"
                      placeholder="e.g., Engineering, Marketing"
                      {...departmentForm.register("name")}
                    />
                    {departmentForm.formState.errors.name && (
                      <p className="text-sm text-red-600">{departmentForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="dept-description">Description</Label>
                    <Textarea
                      id="dept-description"
                      placeholder="Brief description of the department"
                      {...departmentForm.register("description")}
                    />
                    {departmentForm.formState.errors.description && (
                      <p className="text-sm text-red-600">{departmentForm.formState.errors.description.message}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingDepartment(false);
                        setSelectedDepartment(null);
                        departmentForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addDepartmentMutation.isPending}
                    >
                      {isEditingDepartment ? 
                        (addDepartmentMutation.isPending ? "Updating..." : "Update Department") :
                        (addDepartmentMutation.isPending ? "Adding..." : "Add Department")
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Existing Departments List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Departments ({departments.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {departments.map((department: any) => (
                        <TableRow key={department.id}>
                          <TableCell>
                            <div className="font-medium">{department.name}</div>
                          </TableCell>
                          <TableCell>{department.description}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(department.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setIsEditingDepartment(true);
                                  setSelectedDepartment(department);
                                  departmentForm.reset({
                                    name: department.name,
                                    description: department.description
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete the department "${department.name}"? This action cannot be undone.`)) {
                                    deleteDepartmentMutation.mutate(department.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                disabled={deleteDepartmentMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Categories Modal */}
      <Dialog open={showManageCategories} onOpenChange={(open) => {
        setShowManageCategories(open);
        if (!open) {
          setIsEditingCategory(false);
          setSelectedCategory(null);
          categoryForm.reset();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingCategory ? "Edit Category" : "Manage Categories"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEditingCategory ? "Edit Category" : "Add New Category"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="cat-name">Category Name</Label>
                    <Input
                      id="cat-name"
                      placeholder="e.g., Productivity, Communication"
                      {...categoryForm.register("name")}
                    />
                    {categoryForm.formState.errors.name && (
                      <p className="text-sm text-red-600">{categoryForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="cat-description">Description (Optional)</Label>
                    <Textarea
                      id="cat-description"
                      placeholder="Brief description of the category (optional)"
                      {...categoryForm.register("description")}
                    />
                    {categoryForm.formState.errors.description && (
                      <p className="text-sm text-red-600">{categoryForm.formState.errors.description.message}</p>
                    )}
                  </div>
                  

                  
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingCategory(false);
                        setSelectedCategory(null);
                        categoryForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addCategoryMutation.isPending}
                    >
                      {isEditingCategory ? 
                        (addCategoryMutation.isPending ? "Updating..." : "Update Category") :
                        (addCategoryMutation.isPending ? "Adding..." : "Add Category")
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  Current Categories ({categories.length})
                  {categoriesLoading && " (Loading...)"}
                  {categoriesError && " (Error loading)"}
                </CardTitle>
                {categoriesLoading && (
                  <p className="text-sm text-gray-500">Loading categories...</p>
                )}
                {categoriesError && (
                  <p className="text-sm text-red-500">Error loading categories: {categoriesError.message}</p>
                )}
                {!categoriesLoading && !categoriesError && categories.length === 0 && (
                  <p className="text-sm text-gray-500">No categories found. Add your first category above.</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category: any) => (
                        <TableRow key={category.id}>
                          <TableCell>
                            <div className="font-medium">{category.name}</div>
                          </TableCell>
                          <TableCell>{category.description}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(category.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setIsEditingCategory(true);
                                  setSelectedCategory(category);
                                  categoryForm.reset({
                                    name: category.name,
                                    description: category.description
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
                                    deleteCategoryMutation.mutate(category.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                disabled={deleteCategoryMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Statuses Modal */}
      <Dialog open={showManageStatuses} onOpenChange={(open) => {
        setShowManageStatuses(open);
        if (!open) {
          setIsEditingStatus(false);
          setSelectedStatus(null);
          statusForm.reset();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingStatus ? "Edit Status" : "Manage Application Statuses"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEditingStatus ? "Edit Status" : "Add New Status"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={statusForm.handleSubmit(handleStatusSubmit)} className="space-y-4">
                  <div>
                    <Label htmlFor="status-name">Status Name</Label>
                    <Input
                      id="status-name"
                      placeholder="e.g., approved, pending, restricted"
                      {...statusForm.register("name")}
                    />
                    {statusForm.formState.errors.name && (
                      <p className="text-sm text-red-600">{statusForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="status-description">Description (Optional)</Label>
                    <Textarea
                      id="status-description"
                      placeholder="Explain what this status means (optional)"
                      {...statusForm.register("description")}
                    />
                    {statusForm.formState.errors.description && (
                      <p className="text-sm text-red-600">{statusForm.formState.errors.description.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="status-color">Color (Optional)</Label>
                    <Input
                      id="status-color"
                      type="color"
                      {...statusForm.register("color")}
                    />
                    {statusForm.formState.errors.color && (
                      <p className="text-sm text-red-600">{statusForm.formState.errors.color.message}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingStatus(false);
                        setSelectedStatus(null);
                        statusForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addStatusMutation.isPending}
                    >
                      {isEditingStatus ? 
                        (addStatusMutation.isPending ? "Updating..." : "Update Status") :
                        (addStatusMutation.isPending ? "Adding..." : "Add Status")
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>
                  Current Statuses ({statuses.length})
                  {statusesLoading && " (Loading...)"}
                  {statusesError && " (Error loading)"}
                </CardTitle>
                {statusesLoading && (
                  <p className="text-sm text-gray-500">Loading statuses...</p>
                )}
                {statusesError && (
                  <p className="text-sm text-red-500">Error loading statuses: {statusesError.message}</p>
                )}
                {!statusesLoading && !statusesError && statuses.length === 0 && (
                  <p className="text-sm text-gray-500">No statuses found. Add your first status above.</p>
                )}
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statuses.map((status: any) => (
                        <TableRow key={status.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="font-medium">{status.name}</div>
                              <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block cursor-help">
                                      <Badge 
                                        className="text-xs"
                                        style={{ 
                                          backgroundColor: status.color, 
                                          color: 'white',
                                          borderColor: status.color 
                                        }}
                                      >
                                        {status.name.charAt(0).toUpperCase() + status.name.slice(1)}
                                      </Badge>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="max-w-xs bg-gray-900 text-white border-gray-800">
                                    <div className="space-y-1">
                                      <p className="font-semibold text-xs opacity-70">Preview in App</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        <div 
                                          className="w-3 h-3 rounded-full" 
                                          style={{ backgroundColor: status.color }}
                                        ></div>
                                        <p className="text-sm font-medium">{status.name.charAt(0).toUpperCase() + status.name.slice(1)}</p>
                                      </div>
                                      <p className="text-sm opacity-90">{status.description || "No description"}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-600">{status.description || <span className="text-gray-400 italic">No description</span>}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border border-gray-300" 
                                style={{ backgroundColor: status.color }}
                              ></div>
                              <span className="text-sm text-gray-600">{status.color}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(status.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setIsEditingStatus(true);
                                  setSelectedStatus(status);
                                  statusForm.reset({
                                    name: status.name,
                                    description: status.description || "",
                                    color: status.color || "#3b82f6",
                                  });
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete the status "${status.name}"? This action cannot be undone.`)) {
                                    deleteStatusMutation.mutate(status.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                disabled={deleteStatusMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Admin Modal */}
      <Dialog open={showAddAdmin} onOpenChange={(open) => {
        setShowAddAdmin(open);
        if (!open) {
          adminForm.reset();
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Admin</DialogTitle>
          </DialogHeader>
          <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="admin-username">Username</Label>
              <Input
                id="admin-username"
                placeholder="admin.user"
                {...adminForm.register("username")}
              />
              {adminForm.formState.errors.username && (
                <p className="text-sm text-red-600">{adminForm.formState.errors.username.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                placeholder="admin@company.com"
                {...adminForm.register("email")}
              />
              {adminForm.formState.errors.email && (
                <p className="text-sm text-red-600">{adminForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                placeholder="Enter password"
                {...adminForm.register("password")}
              />
              {adminForm.formState.errors.password && (
                <p className="text-sm text-red-600">{adminForm.formState.errors.password.message}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="admin-firstName">First Name</Label>
                <Input
                  id="admin-firstName"
                  placeholder="John"
                  {...adminForm.register("firstName")}
                />
                {adminForm.formState.errors.firstName && (
                  <p className="text-sm text-red-600">{adminForm.formState.errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="admin-lastName">Last Name</Label>
                <Input
                  id="admin-lastName"
                  placeholder="Doe"
                  {...adminForm.register("lastName")}
                />
                {adminForm.formState.errors.lastName && (
                  <p className="text-sm text-red-600">{adminForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="admin-department">Department</Label>
              <Select onValueChange={(value) => adminForm.setValue("department", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: any) => (
                    <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {adminForm.formState.errors.department && (
                <p className="text-sm text-red-600">{adminForm.formState.errors.department.message}</p>
              )}
            </div>
            
            <div className="flex space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddAdmin(false);
                  adminForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createAdminMutation.isPending}
              >
                {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Admins Modal */}
      <Dialog open={showManageAdmins} onOpenChange={(open) => {
        setShowManageAdmins(open);
        if (!open) {
          setIsEditingAdmin(false);
          setSelectedAdmin(null);
          adminForm.reset();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingAdmin ? "Edit Admin User" : "Manage Admin Users"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add Admin Form */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {isEditingAdmin ? "Edit Admin User" : "Add New Admin User"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={adminForm.handleSubmit(handleAdminSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manage-admin-username">Username</Label>
                      <Input
                        id="manage-admin-username"
                        placeholder="admin.user"
                        {...adminForm.register("username")}
                      />
                      {adminForm.formState.errors.username && (
                        <p className="text-sm text-red-600">{adminForm.formState.errors.username.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="manage-admin-email">Email</Label>
                      <Input
                        id="manage-admin-email"
                        type="email"
                        placeholder="admin@company.com"
                        {...adminForm.register("email")}
                      />
                      {adminForm.formState.errors.email && (
                        <p className="text-sm text-red-600">{adminForm.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="manage-admin-password">Password {isEditingAdmin ? "(leave blank to keep current)" : ""}</Label>
                    <Input
                      id="manage-admin-password"
                      type="password"
                      placeholder={isEditingAdmin ? "Leave blank to keep current password" : "Enter password"}
                      {...adminForm.register("password")}
                    />
                    {adminForm.formState.errors.password && (
                      <p className="text-sm text-red-600">{adminForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="manage-admin-firstName">First Name</Label>
                      <Input
                        id="manage-admin-firstName"
                        placeholder="John"
                        {...adminForm.register("firstName")}
                      />
                      {adminForm.formState.errors.firstName && (
                        <p className="text-sm text-red-600">{adminForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="manage-admin-lastName">Last Name</Label>
                      <Input
                        id="manage-admin-lastName"
                        placeholder="Doe"
                        {...adminForm.register("lastName")}
                      />
                      {adminForm.formState.errors.lastName && (
                        <p className="text-sm text-red-600">{adminForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="manage-admin-department">Department</Label>
                    <Select onValueChange={(value) => adminForm.setValue("department", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: any) => (
                          <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {adminForm.formState.errors.department && (
                      <p className="text-sm text-red-600">{adminForm.formState.errors.department.message}</p>
                    )}
                  </div>
                  
                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsEditingAdmin(false);
                        setSelectedAdmin(null);
                        adminForm.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={createAdminMutation.isPending}
                    >
                      {isEditingAdmin ? 
                        (createAdminMutation.isPending ? "Updating..." : "Update Admin") :
                        (createAdminMutation.isPending ? "Creating..." : "Create Admin")
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Existing Admins List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Admin Users ({users.filter(user => user.isAdmin).length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.filter(user => user.isAdmin).map((admin: any) => (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <div className="font-medium">{admin.username}</div>
                          </TableCell>
                          <TableCell>
                            {admin.firstName} {admin.lastName}
                          </TableCell>
                          <TableCell>{admin.email}</TableCell>
                          <TableCell>{admin.department}</TableCell>
                          <TableCell className="text-sm">
                            {new Date(admin.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setIsEditingAdmin(true);
                                  setSelectedAdmin(admin);
                                  adminForm.reset({
                                    username: admin.username,
                                    email: admin.email,
                                    firstName: admin.firstName,
                                    lastName: admin.lastName,
                                    department: admin.department,
                                    password: "" // Don't prefill password
                                  });
                                }}
                                className="text-blue-600 hover:text-blue-700 h-8 w-8 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete the admin user "${admin.username}"? This action cannot be undone.`)) {
                                    deleteAdminMutation.mutate(admin.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                                disabled={deleteAdminMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.filter(user => user.isAdmin).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No admin users found. Create your first admin above.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Requests Modal */}
      <Dialog open={showAllRequests} onOpenChange={setShowAllRequests}>
        <DialogContent className="w-[95vw] max-w-6xl h-[90vh] max-h-[90vh] p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Latest Application Access Requests</DialogTitle>
            <p className="text-sm text-gray-600">Review and approve/reject user requests for application access</p>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <div className="overflow-x-auto">
              <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Submitter</TableHead>
                  <TableHead className="min-w-[140px]">Application</TableHead>
                  <TableHead className="hidden md:table-cell min-w-[200px]">Justification</TableHead>
                  <TableHead className="min-w-[120px]">Department</TableHead>
                  <TableHead className="min-w-[130px]">Status</TableHead>
                </TableRow>
              </TableHeader>
                <TableBody>
                {requests
                  .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((request: any) => (
                  <TableRow key={request.id}>
                    <TableCell className="py-2">
                      <div className="font-medium text-sm">{request.firstName} {request.lastName}</div>
                      <div className="text-xs text-gray-500 truncate">{request.email}</div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="font-medium text-sm">{request.application?.name}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell py-2">
                      <div className="text-sm max-w-[200px] line-clamp-2">{request.justification}</div>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="text-sm">{request.department?.name || 'N/A'}</div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Select 
                        value={request.status} 
                        onValueChange={(newStatus) => handleStatusChange(request.id, newStatus)}
                      >
                        <SelectTrigger className="w-[110px] text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending" className="text-xs">
                            <span className="text-orange-600">Pending</span>
                          </SelectItem>
                          <SelectItem value="approved" className="text-xs">
                            <span className="text-green-600">Approved</span>
                          </SelectItem>
                          <SelectItem value="rejected" className="text-xs">
                            <span className="text-red-600">Rejected</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {requests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="h-8 w-8 text-gray-400" />
                        <p>No application access requests found</p>
                        <p className="text-sm">User requests will appear here when they apply for application access</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View All Logs Modal */}
      <Dialog open={showAllLogs} onOpenChange={setShowAllLogs}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Activity Logs</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activityLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>User #{log.userId}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {log.details ? (
                        typeof log.details === 'string' ? 
                          log.details : 
                          JSON.stringify(log.details)
                      ) : 'No additional details'}
                    </TableCell>
                  </TableRow>
                ))}
                {activityLogs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500">
                      No activity logs found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* CSV Management Modal */}
      <Dialog open={showManageCSV} onOpenChange={(open) => {
        setShowManageCSV(open);
        if (!open) {
          setCsvFile(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage CSV</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Import Applications</h3>
              <div className="space-y-2">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setCsvFile(file);
                      uploadCsvMutation.mutate(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={uploadCsvMutation.isPending}
                />
                {uploadCsvMutation.isPending && (
                  <p className="text-sm text-blue-600">Uploading CSV...</p>
                )}
                {csvFile && (
                  <p className="text-sm text-green-600">Selected: {csvFile.name}</p>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Export Applications</h3>
              <Button
                onClick={handleExportCSV}
                className="w-full"
                disabled={!applications || applications.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export to CSV ({applications?.length || 0} applications)
              </Button>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Refresh Icons</h3>
              <p className="text-sm text-gray-600 mb-2">
                Download and update icons for applications that have URL-based icons
              </p>
              <Button
                onClick={() => refreshIconsMutation.mutate()}
                className="w-full"
                disabled={refreshIconsMutation.isPending}
                variant="outline"
              >
                {refreshIconsMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Refreshing Icons...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Refresh Icons
                  </>
                )}
              </Button>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowManageCSV(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Error Logs Modal */}
      <Dialog open={showErrorLogs} onOpenChange={setShowErrorLogs}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[95vh] p-3 sm:p-6 overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">System Error Logs</DialogTitle>
            <p className="text-sm text-gray-600">Monitor and track system errors by date and context</p>
          </DialogHeader>
          <div className="overflow-y-auto">
            <ErrorLogsModalSimple />
          </div>
        </DialogContent>
      </Dialog>

      <HeroBannerModal
        isOpen={showHeroBannerModal}
        onClose={() => {
          setShowHeroBannerModal(false);
          setSelectedHeroBanner(null);
        }}
        heroBanner={selectedHeroBanner}
      />

      <HelpManagementModal
        isOpen={showHelpManagementModal}
        onClose={() => {
          setShowHelpManagementModal(false);
          setSelectedHelpContent(null);
        }}
        helpContent={selectedHelpContent}
      />

      <AnalyticsModal
        open={showAnalytics}
        onOpenChange={setShowAnalytics}
      />
    </div>
  );
}