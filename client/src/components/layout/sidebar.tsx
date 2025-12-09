import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Home,
  LayoutGrid,
  ClipboardList,
  CheckSquare,
  Users,
  Mail,
  FileText,
  LifeBuoy,
  X,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarProps {
  isAdmin: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isAdmin, isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const sidebarContent = (
    <>
      <ScrollArea className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <nav className="space-y-1">
          <SidebarLink 
            href="/" 
            icon={<Home className="h-5 w-5" />} 
            label="Dashboard" 
            active={isActive("/")} 
          />
          <SidebarLink 
            href="/my-applications" 
            icon={<LayoutGrid className="h-5 w-5" />} 
            label="My Applications" 
            active={isActive("/my-applications")} 
          />
          <SidebarLink 
            href="/requests" 
            icon={<ClipboardList className="h-5 w-5" />} 
            label="Requests" 
            active={isActive("/requests")} 
          />
          
          {isAdmin && (
            <div className="pt-5">
              <h3 className="px-3 text-xs font-semibold text-neutral-medium uppercase tracking-wider">
                Admin
              </h3>
              <div className="mt-2 space-y-1">
                <SidebarLink 
                  href="/admin/approve-requests" 
                  icon={<CheckSquare className="h-5 w-5" />} 
                  label="Approve Requests" 
                  active={isActive("/admin/approve-requests")} 
                />
                <SidebarLink 
                  href="/admin/manage-users" 
                  icon={<Users className="h-5 w-5" />} 
                  label="Manage Users" 
                  active={isActive("/admin/manage-users")} 
                />
                <SidebarLink 
                  href="/admin/send-invitations" 
                  icon={<Mail className="h-5 w-5" />} 
                  label="Send Invitations" 
                  active={isActive("/admin/send-invitations")} 
                />
                <SidebarLink 
                  href="/admin/activity-logs" 
                  icon={<FileText className="h-5 w-5" />} 
                  label="Activity Logs" 
                  active={isActive("/admin/activity-logs")} 
                />
              </div>
            </div>
          )}
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t border-neutral-light">
        <div className="bg-neutral-lightest p-3 rounded-lg">
          <p className="text-sm text-neutral-medium mb-2">Need help?</p>
          <a href="#" className="text-primary text-sm font-medium hover:text-primary-dark">
            Contact Support
          </a>
        </div>
      </div>
    </>
  );
  
  // For desktop: render normal sidebar
  // For mobile: render Sheet component
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="w-64 bg-white border-r border-neutral-light hidden md:flex md:flex-col">
        <div className="h-full flex flex-col">
          {sidebarContent}
        </div>
      </aside>
      
      {/* Mobile sidebar as Sheet */}
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="p-0 w-64">
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-neutral-light flex justify-between items-center">
              <div className="h-8 w-32 bg-primary rounded flex items-center justify-center text-white font-bold">
                GateHub
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {sidebarContent}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function SidebarLink({ href, icon, label, active }: SidebarLinkProps) {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-3 py-2 rounded-md group transition-colors",
          active
            ? "bg-primary text-white"
            : "text-neutral-dark hover:bg-neutral-lightest hover:text-primary"
        )}
      >
        <span
          className={cn(
            "mr-3",
            active ? "text-white" : "text-neutral-medium group-hover:text-primary"
          )}
        >
          {icon}
        </span>
        {label}
      </a>
    </Link>
  );
}
