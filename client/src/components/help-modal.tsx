import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[95vh] overflow-y-auto mx-4">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-semibold text-gray-900">
            {helpContent?.title || "Help & Support"}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading help content...</span>
            </div>
          ) : (
            <div 
              className="prose prose-sm sm:prose max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: helpContent?.content || 
                "<h2>Welcome to WhyBrands Application Portal</h2><p>This portal helps you find and request access to approved software applications for your department.</p><h3>Getting Started</h3><ul><li>Browse available applications</li><li>Use filters to find specific tools</li><li>Request access to applications you need</li></ul><h3>Need More Help?</h3><p>Contact your IT department for additional support.</p>"
              }}
            />
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 px-4"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
