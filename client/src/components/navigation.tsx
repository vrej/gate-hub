import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, ChevronDown, HelpCircle } from "lucide-react";
import { useState } from "react";
import RequestModal from "./request-modal";
import HelpModal from "./help-modal";
import { useAuth } from "@/hooks/use-auth";

interface NavigationProps {
  showUserMenu?: boolean;
  user?: {
    firstName: string;
    lastName: string;
    isAdmin: boolean;
  } | null;
}

export default function Navigation({ showUserMenu = false, user = null }: NavigationProps) {
  const [location, setLocation] = useLocation();
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/login");
  };

  return (
    <>
      <nav className="sticky top-0 z-50" style={{ 
        backgroundColor: '#1E2A38',
        fontFamily: 'Inter, sans-serif',
        padding: '16px 24px'
      }}>
        <div className="flex justify-between items-center">
          {/* Logo on the left */}
          <Link href="/" className="flex items-center">
            <img
              src="/images/GateHubTMbyDWM80.png"
              alt="GateHub Logo"
              style={{ 
                height: '80px', 
                width: 'auto'
              }}
            />
          </Link>

          {/* Right side: Help link and CTA button */}
          <div className="flex items-center gap-4">
            {/* Help Link */}
            <button
              onClick={() => setIsHelpModalOpen(true)}
              style={{
                color: '#94a3b8',
                fontSize: '14px',
                fontWeight: 400,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 0,
                fontFamily: 'Inter, sans-serif',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#cbd5e1'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
            >
              <HelpCircle size={18} />
              <span>Help</span>
            </button>

            {/* Submit Request CTA - Only show on public pages */}
            {!showUserMenu && (
              <button
                onClick={() => setIsRequestModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #A3E635 0%, #84cc16 100%)',
                  color: '#1E2A38',
                  fontSize: '14px',
                  fontWeight: 600,
                  padding: '10px 20px',
                  borderRadius: '12px',
                  border: 'none',
                  boxShadow: '0px 6px 20px rgba(163, 230, 53, 0.25)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0px 8px 24px rgba(163, 230, 53, 0.35)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0px 6px 20px rgba(163, 230, 53, 0.25)'}
              >
                <Plus size={18} />
                <span>Submit an Application Request</span>
              </button>
            )}
            
            {/* User Menu - Only show in admin panel */}
            {showUserMenu && user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-brand text-white text-sm">
                        {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block font-medium" style={{ color: '#94a3b8' }}>
                      {user.firstName} {user.lastName}
                    </span>
                    <ChevronDown className="h-4 w-4" style={{ color: '#94a3b8' }} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleLogout}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>

      <RequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
}
