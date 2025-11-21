import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Application, Request, insertRequestSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

// Request form schema with validation
export const requestFormSchema = insertRequestSchema
  .omit({ requestedBy: true })
  .extend({
    applicationName: z.string().min(3, "Application name must be at least 3 characters"),
    justification: z.string().min(10, "Justification must be at least 10 characters"),
    department: z.string().min(1, "Department is required"),
  });

export type RequestFormData = z.infer<typeof requestFormSchema>;

// Hooks for Excel data operations
export function useApplications() {
  const { toast } = useToast();
  
  return useQuery<Application[], Error>({
    queryKey: ["/api/applications"],
    onError: (error) => {
      toast({
        title: "Failed to load applications",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useRequests() {
  const { toast } = useToast();
  
  return useQuery<Request[], Error>({
    queryKey: ["/api/requests"],
    onError: (error) => {
      toast({
        title: "Failed to load requests",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useCreateRequest() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: RequestFormData) => {
      const res = await apiRequest("POST", "/api/requests", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Request submitted",
        description: "Your application request has been submitted for approval.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateRequestStatus() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/requests/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      toast({
        title: "Request updated",
        description: `The request status has been updated to ${variables.status}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update request",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSendInvitations() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (emails: string[]) => {
      const res = await apiRequest("POST", "/api/invitations", { emails });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitations sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitations",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
