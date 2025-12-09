import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
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

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 16px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#4a5568',
    boxShadow: '0px 4px 12px rgba(149, 157, 165, 0.1)',
    outline: 'none'
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: 500,
    color: '#4a5568',
    marginBottom: '6px',
    display: 'block'
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(30, 42, 56, 0.5)',
          zIndex: 50
        }}
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
          maxWidth: '480px',
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
          zIndex: 51
        }}
      >
        {/* Inner Scrollable Content */}
        <div
          className="modal-scroll-content"
          style={{
            padding: '32px',
            paddingRight: '16px',
            maxHeight: 'calc(90vh - 64px)',
            overflowY: 'auto'
          }}
        >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              color: '#4a5568',
              margin: 0
            }}>
              Submit an Application Request
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#a0aec0',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#a0aec0',
            marginTop: '8px',
            marginBottom: 0
          }}>
            Fill out the form below to have your application evaluated.
          </p>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Application Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Application Name *</label>
            <input
              placeholder="e.g., Slack, Microsoft Teams"
              {...form.register("applicationName")}
              disabled={!!application}
              style={{
                ...inputStyle,
                opacity: application ? 0.7 : 1
              }}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            />
            {form.formState.errors.applicationName && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {form.formState.errors.applicationName.message}
              </p>
            )}
          </div>

          {/* Application URL */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Application URL *</label>
            <input
              placeholder="https://example.com"
              {...form.register("applicationUrl")}
              disabled={!!application}
              style={{
                ...inputStyle,
                opacity: application ? 0.7 : 1
              }}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            />
            {form.formState.errors.applicationUrl && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {form.formState.errors.applicationUrl.message}
              </p>
            )}
          </div>

          {/* First Name & Last Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input
                {...form.register("firstName")}
                placeholder="John"
                style={inputStyle}
                onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
                onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
              />
              {form.formState.errors.firstName && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.firstName.message}
                </p>
              )}
            </div>
            
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input
                {...form.register("lastName")}
                placeholder="Doe"
                style={inputStyle}
                onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
                onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
              />
              {form.formState.errors.lastName && (
                <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                  {form.formState.errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          {/* Email Address */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email Address *</label>
            <input
              type="email"
              {...form.register("email")}
              placeholder="john.doe@company.com"
              style={inputStyle}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            />
            {form.formState.errors.email && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          {/* Department */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Department *</label>
            <select
              onChange={(e) => form.setValue("department", e.target.value)}
              defaultValue=""
              style={{
                ...inputStyle,
                cursor: 'pointer',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23a0aec0' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            >
              <option value="" disabled style={{ color: '#a0aec0' }}>
                {departmentsLoading ? "Loading..." : "Select department"}
              </option>
              {departments.map((dept) => (
                <option key={dept.id.toString()} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            {form.formState.errors.department && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {form.formState.errors.department.message}
              </p>
            )}
          </div>

          {/* Manager's Email */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Manager's Email *</label>
            <input
              type="email"
              {...form.register("managerEmail")}
              placeholder="manager@company.com"
              style={inputStyle}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            />
            {form.formState.errors.managerEmail && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {form.formState.errors.managerEmail.message}
              </p>
            )}
          </div>
          
          {/* Business Justification */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Business Justification *</label>
            <textarea
              placeholder="Explain why you need access to this application..."
              rows={3}
              {...form.register("justification")}
              style={{
                ...inputStyle,
                resize: 'none'
              }}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            />
            {form.formState.errors.justification && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {form.formState.errors.justification.message}
              </p>
            )}
          </div>
          
          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={requestMutation.isPending}
              style={{
                background: 'transparent',
                border: '2px solid #a0aec0',
                borderRadius: '12px',
                padding: '10px 20px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: '#4a5568',
                cursor: 'pointer',
                opacity: requestMutation.isPending ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={requestMutation.isPending}
              style={{
                background: 'linear-gradient(135deg, #A3E635 0%, #84cc16 100%)',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 20px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1E2A38',
                boxShadow: '0px 6px 20px rgba(163, 230, 53, 0.25)',
                cursor: 'pointer',
                opacity: requestMutation.isPending ? 0.5 : 1
              }}
            >
              {requestMutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}
