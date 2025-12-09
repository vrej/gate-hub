import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Loader2 } from "lucide-react";

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const { data: helpContent, isLoading } = useQuery<any>({
    queryKey: ["/api/help-content"],
    enabled: isOpen, // Only fetch when modal is open
  });

  if (!isOpen) return null;

  // Default content if no custom content from API
  const defaultContent = {
    title: "Welcome to GateHub",
    description: "This portal helps you find and request access to approved software applications for your department.",
    gettingStarted: [
      "Browse available applications",
      "Use filters to find specific tools",
      "Request access to applications you need"
    ],
    moreHelp: "Contact your IT department for additional support."
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
          maxWidth: '500px',
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
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#a0aec0'
          }}>
            Help & Support
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#a0aec0',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#4a5568'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#a0aec0'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 0'
          }}>
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#a0aec0' }} />
            <span style={{
              marginLeft: '8px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#a0aec0'
            }}>Loading help content...</span>
          </div>
        ) : (
          <div>
            {/* Main Title */}
            <h2 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              fontWeight: 600,
              color: '#4a5568',
              margin: '0 0 12px 0'
            }}>
              {helpContent?.title?.replace('WhyBrands', 'GateHub') || defaultContent.title}
            </h2>
            
            {/* Description */}
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              color: '#a0aec0',
              lineHeight: 1.6,
              margin: '0 0 24px 0'
            }}>
              {helpContent?.description || defaultContent.description}
            </p>
            
            {/* Getting Started Section */}
            <h3 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              color: '#4a5568',
              marginTop: '24px',
              marginBottom: '12px'
            }}>
              Getting Started
            </h3>
            <ul style={{
              margin: 0,
              padding: 0,
              listStyle: 'none'
            }}>
              {defaultContent.gettingStarted.map((item, index) => (
                <li key={index} style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#a0aec0',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <span style={{
                    color: '#88CF1A',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    lineHeight: '1.2'
                  }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
            
            {/* Need More Help Section */}
            <h3 style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              fontWeight: 600,
              color: '#4a5568',
              marginTop: '24px',
              marginBottom: '12px'
            }}>
              Need More Help?
            </h3>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 400,
              color: '#a0aec0',
              lineHeight: 1.6,
              margin: 0
            }}>
              {defaultContent.moreHelp}
            </p>
          </div>
        )}

        {/* Close Button */}
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #A3E635 0%, #84cc16 100%)',
              color: '#1E2A38',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 600,
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0px 6px 20px rgba(163, 230, 53, 0.25)',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
        </div>
      </div>
    </>
  );
}
