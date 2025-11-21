import { Application } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Mail,
  FileText,
  Layers,
  Share2,
  Clipboard,
  Globe,
  Users,
  Shield,
  BarChart,
  Coffee,
  PieChart,
  Zap,
  BookOpen,
} from "lucide-react";

interface ApplicationCardProps {
  application: Application;
}

export default function ApplicationCard({ application }: ApplicationCardProps) {
  const getIconComponent = () => {
    const iconMap: Record<string, React.ReactNode> = {
      default: <FileText className="h-6 w-6 text-white" />,
      teams: <Users className="h-6 w-6 text-white" />,
      sharepoint: <Share2 className="h-6 w-6 text-white" />,
      outlook: <Mail className="h-6 w-6 text-white" />,
      excel: <PieChart className="h-6 w-6 text-white" />,
      word: <FileText className="h-6 w-6 text-white" />,
      powerpoint: <Layers className="h-6 w-6 text-white" />,
      analytics: <BarChart className="h-6 w-6 text-white" />,
      security: <Shield className="h-6 w-6 text-white" />,
      productivity: <Zap className="h-6 w-6 text-white" />,
      learning: <BookOpen className="h-6 w-6 text-white" />,
      marketing: <Globe className="h-6 w-6 text-white" />,
      development: <Clipboard className="h-6 w-6 text-white" />,
      other: <Coffee className="h-6 w-6 text-white" />,
    };
    
    return iconMap[application.iconType] || iconMap.default;
  };
  
  const getBackgroundColor = () => {
    const bgMap: Record<string, string> = {
      teams: "bg-primary",
      sharepoint: "bg-accent",
      outlook: "bg-primary-light",
      excel: "bg-[#217346]",
      word: "bg-[#2B579A]",
      powerpoint: "bg-[#B7472A]",
      analytics: "bg-accent",
      security: "bg-primary-dark",
      productivity: "bg-primary-light",
      learning: "bg-accent-light", 
      marketing: "bg-[#0078D4]",
      development: "bg-[#5E5E5E]",
      default: "bg-primary",
      other: "bg-neutral-medium",
    };
    
    return bgMap[application.iconType] || bgMap.default;
  };
  
  const getStatusBadgeClass = () => {
    switch (application.status) {
      case "approved":
        return "bg-green-100 text-[#10B981]";
      case "pending":
        return "bg-yellow-100 text-[#F59E0B]";
      case "rejected":
        return "bg-red-100 text-[#EF4444]";
      default:
        return "bg-green-100 text-[#10B981]";
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 h-12 w-12 rounded-md flex items-center justify-center", getBackgroundColor())}>
            {getIconComponent()}
          </div>
          <div className="ml-4">
            <h4 className="text-lg font-medium text-neutral-dark">{application.name}</h4>
            <Badge className={getStatusBadgeClass()}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-neutral-medium">{application.description}</p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Button variant="outline">Details</Button>
          <Button>
            Access
          </Button>
        </div>
      </div>
    </div>
  );
}
