import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Application, Department } from "@shared/schema";

interface RequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: Application | null;
}

const requestSchema = z.object({
  applicationId: z.number().optional(),
  applicationName: z.string().min(1, "Application name is required"),
  applicationUrl: z.string().url("Please enter a valid URL").min(1, "Application URL is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  department: z.string().min(1, "Department is required"),
  managerEmail: z.string().email("Please enter a valid manager email address"),
  justification: z.string().min(10, "Please provide a detailed justification (at least 10 characters)"),
});

type RequestForm = z.infer<typeof requestSchema>;

export default function RequestModal({ isOpen, onClose, application }: RequestModalProps) {
  const { toast } = useToast();
  
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      applicationId: application?.id,
      applicationName: application?.name || "",
      applicationUrl: application?.url || "",
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      managerEmail: "",
      justification: "",
    },
  });

  const requestMutation = useMutation({
    mutationFn: (data: RequestForm) =>
      apiRequest("POST", "/api/requests", {
        applicationId: data.applicationId || null,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        department: data.department,
        managerEmail: data.managerEmail,
        justification: data.justification,
        // Include the application name and URL for new application requests
        applicationName: data.applicationName,
        applicationUrl: data.applicationUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Your access request has been submitted successfully",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RequestForm) => {
    requestMutation.mutate(data);
  };

  // Reset form when modal opens/closes or application changes
  React.useEffect(() => {
    if (isOpen) {
      form.reset({
        applicationId: application?.id,
        applicationName: application?.name || "",
        applicationUrl: application?.url || "",
        firstName: "",
        lastName: "",
        email: "",
        department: "",
        managerEmail: "",
        justification: "",
      });
    }
  }, [isOpen, application, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[420px] max-h-[95vh] overflow-y-auto mx-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Submit an Application Request
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Fill out the form below to have your application evaluated.
          </p>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="applicationName" className="text-sm font-medium">Application Name *</Label>
            <Input
              id="applicationName"
              placeholder="e.g., Slack, Microsoft Teams"
              {...form.register("applicationName")}
              disabled={!!application}
              className="h-9"
            />
            {form.formState.errors.applicationName && (
              <p className="text-xs text-red-600">
                {form.formState.errors.applicationName.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="applicationUrl" className="text-sm font-medium">Application URL *</Label>
            <Input
              id="applicationUrl"
              placeholder="https://example.com"
              {...form.register("applicationUrl")}
              disabled={!!application}
              className="h-9"
            />
            {form.formState.errors.applicationUrl && (
              <p className="text-xs text-red-600">
                {form.formState.errors.applicationUrl.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="firstName" className="text-sm font-medium">First Name *</Label>
              <Input
                id="firstName"
                {...form.register("firstName")}
                placeholder="John"
                className="h-9"
              />
              {form.formState.errors.firstName && (
                <p className="text-xs text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="lastName" className="text-sm font-medium">Last Name *</Label>
              <Input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Doe"
                className="h-9"
              />
              {form.formState.errors.lastName && (
                <p className="text-xs text-red-600">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm font-medium">Email Address *</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="john.doe@company.com"
              className="h-9"
            />
            {form.formState.errors.email && (
              <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="department" className="text-sm font-medium">Department *</Label>
            <Select onValueChange={(value) => form.setValue("department", value)}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder={departmentsLoading ? "Loading..." : "Select department"} />
              </SelectTrigger>
              <SelectContent>
                {departmentsLoading ? (
                  <SelectItem value="loading" disabled>Loading departments...</SelectItem>
                ) : departments.length > 0 ? (
                  departments.map((dept) => (
                    <SelectItem key={dept.id.toString()} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-departments" disabled>No departments found</SelectItem>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.department && (
              <p className="text-xs text-red-600">
                {form.formState.errors.department.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="managerEmail" className="text-sm font-medium">Manager's Email *</Label>
            <Input
              id="managerEmail"
              type="email"
              {...form.register("managerEmail")}
              placeholder="manager@company.com"
              className="h-9"
            />
            {form.formState.errors.managerEmail && (
              <p className="text-xs text-red-600">{form.formState.errors.managerEmail.message}</p>
            )}
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="justification" className="text-sm font-medium">Business Justification *</Label>
            <Textarea
              id="justification"
              placeholder="Explain why you need access to this application..."
              className="resize-none text-sm"
              rows={3}
              {...form.register("justification")}
            />
            {form.formState.errors.justification && (
              <p className="text-xs text-red-600">
                {form.formState.errors.justification.message}
              </p>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:space-x-2 pt-3 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={requestMutation.isPending}
              className="h-9 px-4"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-9 px-4 bg-brand hover:bg-brand-dark"
              disabled={requestMutation.isPending}
            >
              {requestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
