import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar - part of flex layout */}
      <div className="hidden lg:block lg:w-64 lg:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Mobile Sidebar - overlay */}
      <div className="lg:hidden fixed top-0 left-0 h-full z-30">
        <Sidebar />
      </div>

      {/* Main Content - takes remaining space */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar - fixed at top */}
        <div className="w-full z-20">
          <Topbar />
        </div>

        {/* Page Content - responsive padding */}
        <main className="flex-1 overflow-y-auto pt-16 bg-background">
          <div className="p-4 sm:p-6 lg:p-6 w-full min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
