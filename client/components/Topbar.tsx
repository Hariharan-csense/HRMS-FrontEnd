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
  X,
  Check,
  RefreshCw,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { handleLogout } from "@/components/helper/login/login";
import { useNotifications } from "@/hooks/useNotifications";


export const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    refresh 
  } = useNotifications();

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
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "info":
      default:
        return <Info className="w-4 h-4 text-teal-600" />;
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Navigate to the relevant page if actionUrl is provided
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await markAsRead(notificationId);
  };

  const handleDeleteNotification = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleRefreshNotifications = async () => {
    await refresh();
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
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-600 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96">
            <DropdownMenuLabel className="flex justify-between items-center">
              <span>Notifications</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshNotifications}
                  className="p-1 hover:bg-muted rounded transition-colors"
                  title="Refresh notifications"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors relative group ${
                      !notification.read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(e, notification.id)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                            title="Mark as read"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteNotification(e, notification.id)}
                          className="p-1 hover:bg-muted rounded transition-colors"
                          title="Delete notification"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-muted-foreground">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
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
