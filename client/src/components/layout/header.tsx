import { useState } from "react";
import { Link } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, Settings, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

interface HeaderProps {
  toggleSidebar: () => void;
  user: any;
}

export default function Header({ toggleSidebar, user }: HeaderProps) {
  const { logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return "U";
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
  };
  
  return (
    <header className="bg-white border-b border-neutral-light shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="flex-shrink-0">
            <Link href="/">
              <div className="h-8 w-32 bg-primary rounded flex items-center justify-center text-white font-bold cursor-pointer">
                WHY Brands
              </div>
            </Link>
          </div>
          <h1 className="ml-4 text-xl font-semibold hidden sm:block">Application Portal</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="text-neutral-medium hover:text-primary hover:bg-neutral-lightest">
            <Bell className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 flex items-center space-x-2 rounded-full hover:bg-neutral-lightest">
                <div className="h-8 w-8 rounded-full bg-primary-light text-white flex items-center justify-center">
                  <span className="font-medium text-sm">{getInitials()}</span>
                </div>
                <span className="text-sm font-medium text-neutral-dark hidden sm:block">
                  {user ? `${user.firstName} ${user.lastName}` : 'User'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
