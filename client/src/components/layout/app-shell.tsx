import React, { useState } from "react";
import Header from "./header";
import Sidebar from "./sidebar";
import { useAuth } from "@/context/auth-context";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppShell({ children, title, subtitle }: AppShellProps) {
  const { user } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };
  
  return (
    <div className="h-screen flex flex-col">
      <Header 
        toggleSidebar={toggleMobileSidebar} 
        user={user}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar 
          isAdmin={user?.isAdmin || false} 
          isOpen={mobileSidebarOpen}
          onClose={() => setMobileSidebarOpen(false)}
        />
        
        <main className="flex-1 overflow-y-auto bg-neutral-lightest">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-semibold leading-7 text-neutral-dark">
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="mt-1 text-sm text-neutral-medium">
                      {subtitle}
                    </p>
                  )}
                </div>
                
                {/* Page specific actions go here */}
                {/* We'll pass these as props if needed */}
              </div>
              
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
