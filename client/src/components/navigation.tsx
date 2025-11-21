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
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              {/* WhyBrands Logo */}
              <Link href="/" className="flex items-center space-x-3">
                <img
                  src="https://whybrands.com/images/logo.svg"
                  alt="WhyBrands Logo"
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                  Portal
                </span>
              </Link>
              
              {/* Navigation Links - Only show in admin panel */}
              {showUserMenu && (
                <div className="hidden md:flex space-x-6">
                  <Link
                    href="/"
                    className={`font-medium transition-colors duration-200 ${
                      location === "/" ? "text-brand" : "text-gray-700 hover:text-brand"
                    }`}
                  >
                    Applications
                  </Link>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              {/* Help Link - Show on all pages */}
              <Button
                variant="ghost"
                onClick={() => setIsHelpModalOpen(true)}
                className="text-gray-600 hover:text-brand"
                size="sm"
              >
                <HelpCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Help</span>
              </Button>

              {/* Submit Request CTA - Only show on public pages */}
              {!showUserMenu && (
                <Button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="bg-brand hover:bg-brand-dark text-white shadow-sm"
                  size="sm"
                >
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Submit an Application Request</span>
                  <span className="sm:hidden">Submit Request</span>
                </Button>
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
                      <span className="hidden md:block font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
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
