import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MobileTooltip } from "@/components/ui/mobile-tooltip";
import { ApplicationWithRelations } from "@shared/schema";
import { resolveIconUrl, cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Info } from "lucide-react";

interface ApplicationCardProps {
  application: ApplicationWithRelations;
  onRequestAccess: (application: ApplicationWithRelations) => void;
  viewMode?: "grid" | "list";
}

export default function ApplicationCard({ application, onRequestAccess, viewMode = "grid" }: ApplicationCardProps) {
  const isMobile = useIsMobile();

  const getStatusBadge = () => {
    if (!application.status) {
      return <Badge variant="secondary">Unknown</Badge>;
    }
    
    // Map status string to colors
    const statusConfig: Record<string, { color: string; label: string }> = {
      'approved': { color: '#10b981', label: 'Approved' },
      'pending': { color: '#f59e0b', label: 'Pending' },
      'rejected': { color: '#ef4444', label: 'Rejected' },
    };

    const config = statusConfig[application.status.toLowerCase()] || { color: '#6b7280', label: application.status };
    
    return (
      <Badge 
        style={{ 
          backgroundColor: config.color, 
          color: 'white',
          borderColor: config.color 
        }}
      >
        {config.label}
      </Badge>
    );
  };

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-all duration-200">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start space-x-4 flex-1 min-w-0">
              {/* Application Icon */}
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
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{application.name}</h3>
                  {getStatusBadge()}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-3">
                  {application.description || "No description available"}
                </p>
                
                {/* Departments */}
                {application.departments && application.departments.length > 0 && (
                  <div className="mb-2">
                    <span className="font-medium text-sm text-gray-700 mb-1 block">Departments: </span>
                    <div className="flex flex-wrap gap-1">
                      {application.departments.map((dept) => (
                        <span 
                          key={dept.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          {dept.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Categories */}
                {application.categories && application.categories.length > 0 && (
                  <div>
                    <span className="font-medium text-sm text-gray-700 mb-1 block">Categories: </span>
                    <div className="flex flex-wrap gap-1">
                      {application.categories.map((category) => (
                        <span 
                          key={category.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:ml-4 shrink-0">
              <button
                onClick={() => onRequestAccess(application)}
                className="px-3 py-1.5 text-sm font-medium text-brand bg-white border border-brand hover:bg-brand-dark hover:text-white rounded-md transition-colors duration-200"
              >
                Request Access
              </button>
              {application.url && (
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-sm font-medium text-white text-center bg-brand hover:bg-brand-dark rounded-md transition-colors duration-200"
                >
                  Visit 
                </a>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view (default)
  return (
    <Card className="hover:shadow-md transition-all duration-200 h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="flex items-center space-x-4 mb-4">
          {/* Application Icon */}
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
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 mb-1">{application.name}</h3>
            {getStatusBadge()}
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 leading-relaxed flex-grow">
          {application.description || "No description available"}
        </p>
        
        <div className="text-sm text-gray-500 mb-4 space-y-3">
          {application.departments && application.departments.length > 0 && (
            <div>
              <span className="font-medium text-gray-700 mb-2 block">Departments: </span>
              <div className="flex flex-wrap gap-1">
                {application.departments.map((dept) => (
                  <span 
                    key={dept.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                  >
                    {dept.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {application.categories && application.categories.length > 0 && (
            <div>
              <span className="font-medium text-gray-700 mb-2 block">Categories: </span>
              <div className="flex flex-wrap gap-1">
                {application.categories.map((category) => (
                  <span 
                    key={category.id}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {category.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onRequestAccess(application)}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-brand bg-white border border-brand hover:bg-brand-dark hover:text-white rounded-md transition-colors duration-200"
          >
            Request Access
          </button>
          {application.url && (
            <a
              href={application.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-brand hover:bg-brand-dark rounded-md transition-colors duration-200"
            >
              Visit Application
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
