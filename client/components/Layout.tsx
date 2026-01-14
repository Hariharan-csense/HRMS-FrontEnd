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
  {/* Sidebar - always visible on md+ */}
  <Sidebar />

  {/* Main Content - sidebar width account பண்ணு */}
  <div className="flex-1 flex flex-col md:ml-64"> {/* ← md:ml-64 இங்க இருக்கு */}
    {/* Topbar */}
    <Topbar />

    {/* Page Content */}
    <main className="flex-1 overflow-y-auto">
      <div className="p-3 sm:p-4 md:p-8 w-full min-h-full">
        {children}
      </div>
    </main>
  </div>
</div>
  );
};
