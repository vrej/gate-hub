import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";
import { ApplicationWithRelations } from "@shared/schema";
import { resolveIconUrl, cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Info, ExternalLink } from "lucide-react";

interface ApplicationCardProps {
  application: ApplicationWithRelations;
  onRequestAccess: (application: ApplicationWithRelations) => void;
  viewMode?: "grid" | "list";
}

export default function ApplicationCard({ application, onRequestAccess, viewMode = "grid" }: ApplicationCardProps) {
  const isMobile = useIsMobile();

  const getStatusBadge = () => {
    if (!application.status) {
      return <span style={{
        padding: '4px 10px',
        borderRadius: '8px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 500,
        background: '#6b7280',
        color: 'white'
      }}>Unknown</span>;
    }
    
    const statusLower = application.status.toLowerCase();
    
    if (statusLower === 'approved') {
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: '8px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          fontWeight: 500,
          background: 'linear-gradient(135deg, #A3E635 0%, #84cc16 100%)',
          color: '#1E2A38',
          boxShadow: '0px 4px 12px rgba(163, 230, 53, 0.2)'
        }}>Approved</span>
      );
    }
    
    if (statusLower === 'pending') {
      return (
        <span style={{
          padding: '4px 10px',
          borderRadius: '8px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          fontWeight: 500,
          background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
          color: '#1E2A38',
          boxShadow: '0px 4px 12px rgba(251, 191, 36, 0.2)'
        }}>Pending</span>
      );
    }
    
    // Default for other statuses
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '8px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '12px',
        fontWeight: 500,
        background: '#6b7280',
        color: 'white'
      }}>{application.status}</span>
    );
  };

  if (viewMode === "list") {
    return (
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left Side - Icon + Text */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '250px' }}>
          {/* Application Icon - Keep original */}
          <div className="w-10 h-10 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
            {application.icon ? (
              <img 
                src={resolveIconUrl(application.icon)} 
                alt={application.name} 
                className="w-5 h-5 text-white" 
              />
            ) : (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 0v12h12V4H4z" clipRule="evenodd" />
                <path d="M6 6h8v2H6V6zM6 10h8v2H6v-2zM6 14h5v2H6v-2z" />
              </svg>
            )}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '16px',
                fontWeight: 600,
                color: '#4a5568'
              }}>{application.name}</span>
              {getStatusBadge()}
            </div>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#a0aec0',
              marginTop: '4px',
              margin: 0
            }}>
              {application.description || "No description available"}
            </p>
          </div>
        </div>
        
        {/* Right Side - Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => onRequestAccess(application)}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: '2px solid #A3E635',
              background: 'transparent',
              color: '#4a5568',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Request Access
          </button>
          {application.url && (
            <a
              href={application.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #A3E635 0%, #84cc16 100%)',
                color: '#1E2A38',
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: '0px 6px 20px rgba(163, 230, 53, 0.25)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              Visit
              <ExternalLink size={14} />
            </a>
          )}
        </div>
      </div>
    );
  }

  // Grid view (default)
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: '16px',
      padding: '20px 24px',
      boxShadow: '0px 8px 24px rgba(149, 157, 165, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    }}>
      {/* Header - Icon + Name + Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
        {/* Application Icon - Keep original */}
        <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center flex-shrink-0">
          {application.icon ? (
            <img 
              src={resolveIconUrl(application.icon)} 
              alt={application.name} 
              className="w-6 h-6 text-white" 
            />
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 0v12h12V4H4z" clipRule="evenodd" />
              <path d="M6 6h8v2H6V6zM6 10h8v2H6v-2zM6 14h5v2H6v-2z" />
            </svg>
          )}
        </div>
        
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            fontWeight: 600,
            color: '#4a5568',
            display: 'block',
            marginBottom: '6px'
          }}>{application.name}</span>
          {getStatusBadge()}
        </div>
      </div>
      
      {/* Description */}
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '14px',
        color: '#a0aec0',
        marginTop: '4px',
        marginBottom: '16px',
        flex: 1
      }}>
        {application.description || "No description available"}
      </p>
      
      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => onRequestAccess(application)}
          style={{
            flex: 1,
            padding: '10px 20px',
            borderRadius: '12px',
            border: '2px solid #A3E635',
            background: 'transparent',
            color: '#4a5568',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}
        >
          Request Access
        </button>
        {application.url && (
          <a
            href={application.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              background: 'linear-gradient(135deg, #A3E635 0%, #84cc16 100%)',
              color: '#1E2A38',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              boxShadow: '0px 6px 20px rgba(163, 230, 53, 0.25)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              textDecoration: 'none'
            }}
          >
            Visit
            <ExternalLink size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
