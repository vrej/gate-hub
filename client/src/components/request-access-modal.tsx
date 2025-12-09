import { useState } from "react";
import { X } from "lucide-react";
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

  const [closeHovered, setCloseHovered] = useState(false);

  const inputStyle: React.CSSProperties = {
    background: 'linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)',
    border: 'none',
    borderRadius: '12px',
    padding: '12px 16px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#4a5568',
    boxShadow: '0px 4px 12px rgba(149, 157, 165, 0.1)',
    width: '100%',
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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30, 42, 56, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '24px',
          boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
          maxWidth: '420px',
          width: '90vw',
          maxHeight: '90vh',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Close Button - Outside scrollable area */}
        <button
          onClick={onClose}
          onMouseEnter={() => setCloseHovered(true)}
          onMouseLeave={() => setCloseHovered(false)}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: closeHovered ? '#4a5568' : '#a0aec0',
            transition: 'color 0.2s',
            zIndex: 10
          }}
        >
          <X size={20} />
        </button>

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
        <div style={{ marginBottom: '24px', paddingRight: '24px' }}>
          <h2 style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '20px',
            fontWeight: 600,
            color: '#4a5568',
            margin: 0
          }}>
            Request Access to {application?.name}
          </h2>
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 400,
            color: '#a0aec0',
            marginTop: '8px',
            marginBottom: 0
          }}>
            Please fill out the form below to request access to this application.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label htmlFor="firstName" style={labelStyle}>First Name *</label>
              <input
                id="firstName"
                {...form.register("firstName")}
                placeholder="John"
                style={inputStyle}
                onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
                onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
              />
              {form.formState.errors.firstName && (
                <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>{form.formState.errors.firstName.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="lastName" style={labelStyle}>Last Name *</label>
              <input
                id="lastName"
                {...form.register("lastName")}
                placeholder="Doe"
                style={inputStyle}
                onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
                onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
              />
              {form.formState.errors.lastName && (
                <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="email" style={labelStyle}>Email Address *</label>
            <input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="john.doe@company.com"
              style={inputStyle}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            />
            {form.formState.errors.email && (
              <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="department" style={labelStyle}>Department *</label>
            <select
              id="department"
              onChange={(e) => form.setValue("department", e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
              defaultValue=""
            >
              <option value="" disabled style={{ color: '#a0aec0' }}>
                {departmentsLoading ? "Loading..." : "Select department"}
              </option>
              {!departmentsLoading && departments.length > 0 && departments.map((dept) => (
                <option key={dept.id.toString()} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
            {form.formState.errors.department && (
              <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>{form.formState.errors.department.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="managerEmail" style={labelStyle}>Manager's Email *</label>
            <input
              id="managerEmail"
              type="email"
              {...form.register("managerEmail")}
              placeholder="manager@company.com"
              style={inputStyle}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            />
            {form.formState.errors.managerEmail && (
              <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>{form.formState.errors.managerEmail.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="justification" style={labelStyle}>Justification *</label>
            <textarea
              id="justification"
              {...form.register("justification")}
              placeholder="Explain why you need access to this application..."
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(163, 230, 53, 0.2)'}
              onBlur={(e) => e.target.style.boxShadow = '0px 4px 12px rgba(149, 157, 165, 0.1)'}
            />
            {form.formState.errors.justification && (
              <p style={{ fontSize: '12px', color: '#e53e3e', marginTop: '4px' }}>{form.formState.errors.justification.message}</p>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitRequestMutation.isPending}
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
                opacity: submitRequestMutation.isPending ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitRequestMutation.isPending}
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
                opacity: submitRequestMutation.isPending ? 0.5 : 1
              }}
            >
              {submitRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}