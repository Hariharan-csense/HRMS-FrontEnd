import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { hasRole } from "@/lib/auth";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell,
  LogOut,
  User,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Info,
  LayoutDashboard,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { handleLogout } from "@/components/helper/login/login";

interface Notification {
  id: string;
  type: "success" | "warning" | "info";
  title: string;
  description: string;
  timestamp: string;
}

export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const getLeaveNotifications = () => {
    const leaveNotifications: Notification[] = [];

    // Manager approval notifications
    if (hasRole(user, "manager") || hasRole(user, "hr")) {
      leaveNotifications.push(
        {
          id: "1",
          type: "info",
          title: "Leave Request from Sarah Johnson",
          description: "Sarah Johnson has applied for 3 days leave (Dec 20-22)",
          timestamp: "30 minutes ago",
        },
        {
          id: "2",
          type: "info",
          title: "Leave Request from Michael Chen",
          description: "Michael Chen has applied for 2 days leave (Dec 24-25)",
          timestamp: "1 hour ago",
        }
      );
    }

    // Employee application notifications
    if (hasRole(user, "employee")) {
      leaveNotifications.push(
        {
          id: "3",
          type: "success",
          title: "Leave Application Submitted",
          description: "Your leave request for Dec 24-25 has been submitted to Michael Manager",
          timestamp: "1 hour ago",
        }
      );
    }

    // HR sees all leave notifications
    if (hasRole(user, "hr")) {
      leaveNotifications.push(
        {
          id: "4",
          type: "success",
          title: "Leave Approved",
          description: "Leave request from John Doe (Dec 10-12) has been approved by Michael Manager",
          timestamp: "2 hours ago",
        },
        {
          id: "5",
          type: "warning",
          title: "Leave Rejected",
          description: "Leave request from Emma Wilson (Dec 20) has been rejected",
          timestamp: "3 hours ago",
        }
      );
    }

    return leaveNotifications;
  };

  const [notifications] = useState<Notification[]>(getLeaveNotifications());

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case "info":
        return <Info className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleViewProfile = () => {
    navigate("/profile");
  };

  const onLogout = async () => {
    const result = await handleLogout();
    if (result.success) {
      navigate("/login");
    }
  };

  return (
    <header className="h-20 bg-white border-b border-border flex items-center justify-between px-4 md:px-8 md:ml-64 fixed md:static top-0 right-0 left-0 md:left-auto z-20">
      {/* Left Section - Dashboard Button */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => navigate("/dashboard")}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            location.pathname === "/dashboard"
              ? "bg-teal-100 text-teal-700"
              : "hover:bg-muted text-muted-foreground hover:text-foreground"
          }`}
          title="Go to Dashboard"
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-sm font-medium">Overview</span>
        </button>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative p-2 hover:bg-muted rounded-lg transition-colors group"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                {notifications.length}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="px-4 py-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div className="pt-0.5">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          {notification.title}
                        </p>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {notification.description}
                        </p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          {notification.timestamp}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <p>No notifications</p>
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 p-1 hover:bg-muted rounded-lg transition-colors">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden sm:flex flex-col items-start text-sm">
                <span className="font-medium text-foreground">{user.name}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {user.roles[0]}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-1">
              <span className="font-medium">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleViewProfile}
              className="cursor-pointer gap-2"
            >
              <User className="w-4 h-4" />
              <span>View Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer gap-2 text-destructive focus:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
