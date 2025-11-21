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

  // Get current user from auth hook
  const { user: currentUser, isLoading } = useAuth();
  


  // Redirect if not admin or still loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-brand" />
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <UserCog className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 mb-2">Access Denied</p>
          <p className="text-sm text-gray-500">You must be an admin to view this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation showUserMenu={true} user={currentUser} />
      
      {/* Admin Dashboard */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 uppercase tracking-wide">
              Admin Dashboard
            </h2>
            <p className="text-gray-600 text-lg">
              Manage applications, users, and access requests across the organization.
            </p>
          </div>

          {/* Admin Stats */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
                      <div className="text-gray-600 text-sm">Total Users</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.approvedToday}</div>
                      <div className="text-gray-600 text-sm">Approved Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.pendingRequests}</div>
                      <div className="text-gray-600 text-sm">Pending Requests</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Dock className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-2xl font-bold text-gray-900">{stats.totalApplications}</div>
                      <div className="text-gray-600 text-sm">Total Applications</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Dock className="h-5 w-5 mr-2" />
                  Applications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Add new applications and manage existing ones
                </p>
                <Button 
                  onClick={() => {
                    setShowManageApplications(true);
                    scrollToTopOfModal();
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Applications
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Departments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage organizational departments
                </p>
                <Button 
                  onClick={() => setShowManageDepartments(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Departments
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Tags className="h-5 w-5 mr-2" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Organize applications by categories
                </p>
                <Button 
                  onClick={() => setShowManageCategories(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Categories
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Application Statuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage application approval statuses
                </p>
                <Button 
                  onClick={() => setShowManageStatuses(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Manage Statuses
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCog className="h-5 w-5 mr-2" />
                  Admin Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage admin accounts and permissions
                </p>
                <Button 
                  onClick={() => setShowManageAdmins(true)}
                  className="w-full"
                >
                  <UserCog className="h-4 w-4 mr-2" />
                  Manage Admins
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2" />
                  View Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Review all access requests
                </p>
                <Button 
                  onClick={() => setShowAllRequests(true)}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View All Requests
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <File className="h-5 w-5 mr-2" />
                  CSV Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Import/export applications via CSV
                </p>
                <Button 
                  onClick={() => setShowManageCSV(true)}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Manage CSV
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Database Migration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Fix IT/IT-test issue by migrating to new schema
                </p>
                <Button 
                  onClick={handleRunMigration}
                  disabled={migrationMutation.isPending}
                  className="w-full"
                  variant="destructive"
                >
                  {migrationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  {migrationMutation.isPending ? "Running Migration..." : "Run Schema Migration"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Error Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  View and manage system error logs ({errorLogsStats?.totalErrors || 0} total)
                </p>
                <Button 
                  onClick={() => setShowErrorLogs(true)}
                  className="w-full"
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  View Error Logs
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="h-5 w-5 mr-2" />
                  Hero Banner
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Customize the hero banner content on the main page
                </p>
                <Button 
                  onClick={() => {
                    const activeBanner = heroBannerData?.find((banner: any) => banner.isActive) || heroBannerData?.[0];
                    setSelectedHeroBanner(activeBanner);
                    setShowHeroBannerModal(true);
                  }}
                  className="w-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Hero Banner
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Help Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Manage the help content displayed in the help modal
                </p>
                <Button 
                  onClick={() => {
                    const activeHelpContent = helpContentData?.find((content: any) => content.isActive) || helpContentData?.[0];
                    setSelectedHelpContent(activeHelpContent);
                    setShowHelpManagementModal(true);
                  }}
                  className="w-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Help Content
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  View traffic, engagement statistics and user activity trends
                </p>
                <Button 
                  onClick={() => setShowAnalytics(true)}
                  className="w-full"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Activity Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <History className="h-5 w-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.length > 0 ? (
                  <>
                    {activityLogs.slice(0, 5).map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div className="flex-1">
                          <div className="text-sm font-medium">
                            {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {log.entityType}
                        </Badge>
                      </div>
                    ))}
                    <div className="pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowAllLogs(true)}
                        className="w-full"
                      >
                        View All Activity
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">No recent activity</span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllLogs(true)}
                    >
                      View All
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
        <DialogContent ref={modalContentRef} className="max-w-[98vw] sm:max-w-6xl lg:max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3">
            <DialogTitle className="text-lg">
              {isEditingApplication ? "Edit Application" : "Manage Applications"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Add Application Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {isEditingApplication ? "Edit Application" : "Add New Application"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <form onSubmit={applicationForm.handleSubmit(handleApplicationSubmit)} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="name" className="text-xs font-medium">Application Name</Label>
                      <div className="flex gap-1">
                        <Input
                          id="name"
                          placeholder="e.g., Slack, Microsoft Teams"
                          className="h-8 text-sm flex-1"
                          {...applicationForm.register("name")}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            console.log("Button clicked, calling AI generation...");
                            handleGenerateAIInfo();
                          }}

                          disabled={isGeneratingAI || generateAIInfoMutation.isPending}
                          className="h-8 px-2 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Generate URL and description with AI"
                        >
                          {isGeneratingAI || generateAIInfoMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Sparkles className="h-3 w-3" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            console.log("Test button clicked, calling AI test...");
                            handleTestAI();
                          }}
                          disabled={testAIMutation.isPending}
                          className="h-8 px-2 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                          title="Test AI service"
                        >
                          {testAIMutation.isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <span className="text-xs">🧪</span>
                          )}
                        </button>
                      </div>
                      {applicationForm.formState.errors.name && (
                        <p className="text-xs text-red-600 mt-1">{applicationForm.formState.errors.name.message}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        ✨ Generate URL & description | ✨ Generate icon URL (next to icon upload) | 🧪 Test AI responses
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="url" className="text-xs font-medium">Application URL (Optional)</Label>
                      <Input
                        id="url"
                        placeholder="https://example.com (optional)"
                        className="h-8 text-sm"
                        {...applicationForm.register("url")}
                      />
                      {applicationForm.formState.errors.url && (
                        <p className="text-xs text-red-600 mt-1">{applicationForm.formState.errors.url.message}</p>
                      )}
                      {aiSuggestions.url && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-blue-600">AI suggests: {aiSuggestions.url}</p>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-5 px-2 text-xs"
                            onClick={() => {
                              applicationForm.setValue("url", aiSuggestions.url!);
                              setAISuggestions(prev => ({ ...prev, url: undefined }));
                            }}
                          >
                            Use
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-5 px-2 text-xs"
                            onClick={() => setAISuggestions(prev => ({ ...prev, url: undefined }))}
                          >
                            ×
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="status" className="text-xs font-medium">Status</Label>
                      <Select 
                        value={applicationForm.watch("statusId")?.toString()} 
                        onValueChange={(value) => applicationForm.setValue("statusId", parseInt(value))}
                      >
                        <SelectTrigger className="h-8 text-sm">
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
                        <p className="text-xs text-red-600 mt-1">{applicationForm.formState.errors.statusId.message}</p>
                      )}
                      {!applicationForm.watch("approvedDepartments")?.length && applicationForm.watch("statusId") === 1 && (
                        <p className="text-xs text-amber-600 mt-1">
                          ⚠️ Applications without departments will be set to "Pending Review"
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="text-xs font-medium">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the application (optional)"
                      className="text-sm resize-none h-16"
                      {...applicationForm.register("description")}
                    />
                    {applicationForm.formState.errors.description && (
                      <p className="text-xs text-red-600 mt-1">{applicationForm.formState.errors.description.message}</p>
                    )}
                    {aiSuggestions.description && (
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-blue-600">AI suggests: {aiSuggestions.description}</p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-5 px-2 text-xs"
                          onClick={() => {
                            applicationForm.setValue("description", aiSuggestions.description!);
                            setAISuggestions(prev => ({ ...prev, description: undefined }));
                          }}
                        >
                          Use
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-5 px-2 text-xs"
                          onClick={() => setAISuggestions(prev => ({ ...prev, description: undefined }))}
                        >
                          ×
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label htmlFor="app-icon" className="text-xs font-medium">Application Icon</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            id="app-icon"
                            type="file"
                            accept="image/*"
                            className="block flex-1 text-xs text-gray-500 file:mr-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
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
                            className="h-8 px-2 text-xs border border-gray-300 rounded bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0"
                            title="Generate icon URL with AI"
                          >
                            {generateIconMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Sparkles className="h-3 w-3" />
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
                        <Label className="text-xs font-medium">
                          Approved Departments (Optional)
                          {applicationForm.watch("status") === "approved" && (
                            <span className="text-amber-600 ml-1">*</span>
                          )}
                        </Label>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            applicationForm.setValue("approvedDepartments", []);
                          }}
                          className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Unselect All
                        </Button>
                      </div>
                      <div className="space-y-1 max-h-20 overflow-y-auto border p-1 rounded text-xs">
                        {departments.map((dept: any) => {
                          const approvedDepartments = applicationForm.watch("approvedDepartments") || [];
                          const isSelected = approvedDepartments.includes(dept.name);
                          
                          return (
                            <label key={dept.id} className="flex items-center space-x-1">
                              <input
                                type="checkbox"
                                value={dept.name}
                                className="w-3 h-3"
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
                              <span className="text-xs">{dept.name}</span>
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
                      <Label className="text-xs font-medium">
                        Categories ({categories.length})
                        {categoriesLoading && " (Loading...)"}
                        {categoriesError && " (Error loading)"}
                      </Label>
                      <div className="space-y-1 max-h-20 overflow-y-auto border p-1 rounded text-xs">
                        {categoriesLoading ? (
                          <p className="text-xs text-gray-500">Loading categories...</p>
                        ) : categoriesError ? (
                          <p className="text-xs text-red-500">Error loading categories</p>
                        ) : categories && categories.length > 0 ? (
                          categories.map((category: any) => {
                            const selectedCategories = applicationForm.watch("categories") || [];
                            
                            
                            return (
                              <label key={category.id} className="flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  value={category.name}
                                  className="w-3 h-3"
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
                                <span className="text-xs">{category.name}</span>
                              </label>
                            );
                          })
                        ) : (
                          <p className="text-xs text-gray-500">No categories available</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hideFromPublic"
                      checked={applicationForm.watch("hideFromPublic") || false}
                      onCheckedChange={(checked) => applicationForm.setValue("hideFromPublic", checked as boolean)}
                    />
                    <Label htmlFor="hideFromPublic" className="text-xs font-medium cursor-pointer">
                      Hide from front (only visible to admins)
                    </Label>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingApplication(false);
                        setSelectedApplication(null);
                        applicationForm.reset();
                        setAISuggestions({});
                      }}
                      className="h-8 px-3 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      size="sm"
                      disabled={addApplicationMutation.isPending || updateApplicationMutation.isPending}
                      className="h-8 px-3 text-xs"
                    >
                      {isEditingApplication ? 
                        (updateApplicationMutation.isPending ? "Updating..." : "Update") :
                        (addApplicationMutation.isPending ? "Adding..." : "Add Application")
                      }
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Search and Filters - Only show when not editing */}
            {!isEditingApplication && (
              <div className="py-4 px-6 bg-gray-50 rounded-lg border">
                {/* Single Row - Search and All Filters */}
                <div className="flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[160px]">
                    <Label className="text-xs text-gray-700 mb-1 block">Search</Label>
                    <Input
                      placeholder="Search applications..."
                      value={appSearchQuery}
                      onChange={(e) => setAppSearchQuery(e.target.value)}
                      className="w-full h-8 text-sm"
                    />
                  </div>
                  
                  <div className="min-w-[110px]">
                    <Label className="text-xs text-gray-700 mb-1 block">Status</Label>
                    <Select value={appStatusFilter} onValueChange={setAppStatusFilter}>
                      <SelectTrigger className="w-full h-8 text-sm">
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
                    <Label className="text-xs text-gray-700 mb-1 block">Department</Label>
                    <Select value={appDepartmentFilter} onValueChange={setAppDepartmentFilter}>
                      <SelectTrigger className="w-full h-8 text-sm">
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
                    <Label className="text-xs text-gray-700 mb-1 block">Icon</Label>
                    <Select value={hasIcon} onValueChange={setHasIcon}>
                      <SelectTrigger className="w-full h-8 text-sm">
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
                    <Label className="text-xs text-gray-700 mb-1 block">URL</Label>
                    <Select value={hasURL} onValueChange={setHasURL}>
                      <SelectTrigger className="w-full h-8 text-sm">
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
                    <Label className="text-xs text-gray-700 mb-1 block">Categories</Label>
                    <Select value={hasCategories} onValueChange={setHasCategories}>
                      <SelectTrigger className="w-full h-8 text-sm">
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
                    <Label className="text-xs text-gray-700 mb-1 block">Description</Label>
                    <Select value={hasDescription} onValueChange={setHasDescription}>
                      <SelectTrigger className="w-full h-8 text-sm">
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
                    <Label className="text-xs text-gray-700 mb-1 block">Visibility</Label>
                    <Select value={hiddenFilter} onValueChange={setHiddenFilter}>
                      <SelectTrigger className="w-full h-8 text-sm">
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
                      <Button
                        variant="outline"
                        size="sm"
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
                        className="flex items-center space-x-1 h-8"
                      >
                        <X className="h-3 w-3" />
                        <span>Clear</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Existing Applications List */}
            <Card>
              <CardHeader>
                <CardTitle>Current Applications ({filteredApplications.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto border rounded">
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
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              {applications.length === 0 ? "No applications found. Add your first application above." : "No applications match your search criteria."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
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