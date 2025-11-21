import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Application, Department } from "@shared/schema";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RequestAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
}

const requestSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  department: z.string().min(1, "Department is required"),
  managerEmail: z.string().email("Please enter a valid manager email address"),
  justification: z.string().min(10, "Please provide a detailed justification (minimum 10 characters)"),
});

type RequestForm = z.infer<typeof requestSchema>;

export default function RequestAccessModal({ isOpen, onClose, application }: RequestAccessModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: departments = [], isLoading: departmentsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      department: "",
      managerEmail: "",
      justification: "",
    },
  });

  const submitRequestMutation = useMutation({
    mutationFn: (data: RequestForm & { applicationId: number }) =>
      apiRequest("POST", "/api/requests", data),
    onSuccess: () => {
      toast({
        title: "Request submitted",
        description: "Your access request has been submitted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
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
    if (!application) return;
    
    submitRequestMutation.mutate({
      ...data,
      applicationId: application.id,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            Request Access to {application?.name}
          </DialogTitle>
          <p className="text-sm text-gray-600 mt-1">
            Please fill out the form below to request access to this application.
          </p>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
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
              <p className="text-xs text-red-600">{form.formState.errors.department.message}</p>
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
            <Label htmlFor="justification" className="text-sm font-medium">Justification *</Label>
            <Textarea
              id="justification"
              {...form.register("justification")}
              placeholder="Explain why you need access to this application..."
              rows={3}
              className="resize-none text-sm"
            />
            {form.formState.errors.justification && (
              <p className="text-xs text-red-600">{form.formState.errors.justification.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitRequestMutation.isPending}
              className="h-9 px-4"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={submitRequestMutation.isPending}
              className="h-9 px-4 bg-brand hover:bg-brand-dark"
            >
              {submitRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}