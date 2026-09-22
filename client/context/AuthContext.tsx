import React, { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContextType, User } from "@/lib/auth";
import ENDPOINTS, {
  BASE_URL,
  checkAndRefreshTokenIfNeeded,
  hasRefreshCredential,
  isAutoLoginPaused,
  refreshAccessToken,
  resolveFileUrl,
} from "../lib/endpoint";
import { profileManager } from "@/lib/profileManager";
import { isValidLoginIdentifier, normalizeEmail } from "@/lib/validation";
import {
  registerWebPushNotifications,
  unregisterStoredWebPushToken,
} from "@/services/firebaseMessaging";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SOFT_LOGOUT_PROMPT_KEY = "auth:showWelcomeBack";
const AUTH_SESSION_KEY = "auth:session";

type RememberedAuthSession = {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  rememberMe?: boolean;
  savedAt?: string;
};

const setReadableAuthCookie = (
  name: string,
  value: string,
  maxAgeSeconds: number,
) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};

const clearDebugCookies = () => {
  if (typeof document === "undefined") return;
  document.cookie =
    "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie =
    "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie =
    "accessTokenDebug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie =
    "refreshTokenDebug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
};

const getStoredRefreshToken = () =>
  localStorage.getItem("refreshToken") ||
  getRememberedAuthSession()?.refreshToken ||
  sessionStorage.getItem("refreshToken");

const getRememberedAuthSession = (): RememberedAuthSession | null => {
  try {
    const savedSession = localStorage.getItem(AUTH_SESSION_KEY);
    return savedSession ? JSON.parse(savedSession) : null;
  } catch (error) {
    console.error("Failed to read remembered auth session", error);
    return null;
  }
};

const saveRememberedAuthSession = (session: RememberedAuthSession) => {
  localStorage.setItem(
    AUTH_SESSION_KEY,
    JSON.stringify({
      ...getRememberedAuthSession(),
      ...session,
      savedAt: new Date().toISOString(),
    }),
  );
};

const clearRememberedAuthSession = () => {
  localStorage.removeItem(AUTH_SESSION_KEY);
};

const isRefreshFailureDefinitelyInvalid = (error: any) => {
  const status = error?.response?.status;
  const message = String(error?.response?.data?.message || "")
    .toLowerCase()
    .trim();

  if (status === 400 && message.includes("refresh token is required")) {
    return true;
  }

  if (status !== 401) {
    return false;
  }

  return (
    message.includes("refresh token expired") ||
    message.includes("invalid refresh token") ||
    message.includes("invalid token type") ||
    message.includes("invalid user type") ||
    message.includes("user not found") ||
    message.includes("admin user not found") ||
    message.includes("employee not found")
  );
};

const decodeJwtPayload = (token: string) => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(normalized));
  } catch (error) {
    console.error("Failed to decode access token payload", error);
    return null;
  }
};

const normalizeUserAvatar = (user: User | null): User | null => {
  if (!user) return user;
  return {
    ...user,
    avatar: resolveFileUrl(user.avatar) || user.avatar,
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const storeLogoutFeedback = (message: string) => {
    sessionStorage.setItem(
      "authToast",
      JSON.stringify({ type: "success", message }),
    );
  };

  const finalizeUserSession = async (
    baseUser: User,
    options?: { rememberMe?: boolean },
  ): Promise<User> => {
    let resolvedUser = { ...baseUser };

    try {
      const profileResponse = await ENDPOINTS.getProfile();
      const profileData = profileResponse.data?.data || profileResponse.data;
      const fullName = [profileData?.first_name, profileData?.last_name]
        .filter(Boolean)
        .join(" ")
        .trim();
      const profileEmail = String(profileData?.email || "")
        .toLowerCase()
        .trim();
      const userEmail = String(resolvedUser.email || "")
        .toLowerCase()
        .trim();

      if (profileData && (!profileEmail || profileEmail === userEmail)) {
        resolvedUser = {
          ...resolvedUser,
          name: fullName || resolvedUser.name,
          employee_id:
            profileData.employee_id ||
            profileData.employeeId ||
            resolvedUser.employee_id ||
            resolvedUser.employeeId,
          employeeId:
            profileData.employee_id ||
            profileData.employeeId ||
            resolvedUser.employeeId ||
            resolvedUser.employee_id,
          avatar: profileData.profile_photo
            ? resolveFileUrl(profileData.profile_photo)
            : profileEmail
              ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(profileEmail)}`
              : undefined,
          department:
            profileData.department_name || resolvedUser.department || null,
        };
      }
    } catch (error) {
      // console.log("Profile image loading skipped during login");
    }

    localStorage.setItem("user", JSON.stringify(resolvedUser));
    setUser(resolvedUser);

    if (resolvedUser.roles?.length) {
      localStorage.setItem("userRole", resolvedUser.roles[0]);
    } else {
      localStorage.setItem("userRole", "employee");
    }

    const shouldRememberSession =
      options?.rememberMe || localStorage.getItem("rememberMe") === "true";

    if (shouldRememberSession) {
      profileManager.saveProfile(resolvedUser, true);
      profileManager.saveAccountSession(
        resolvedUser,
        getStoredRefreshToken() || undefined,
      );
      saveRememberedAuthSession({
        accessToken: localStorage.getItem("accessToken") || undefined,
        refreshToken: getStoredRefreshToken() || undefined,
        user: resolvedUser,
        rememberMe: true,
      });
    } else {
      clearRememberedAuthSession();
    }

    sessionStorage.removeItem(SOFT_LOGOUT_PROMPT_KEY);
    return resolvedUser;
  };

  const autoLogin = async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    setIsLoading(true);
    try {
      if (!hasRefreshCredential() || isAutoLoginPaused()) {
        return {
          success: false,
          message: "Please login again.",
        };
      }

      const newAccessToken = await refreshAccessToken();
      const decoded = decodeJwtPayload(newAccessToken);
      const savedProfile = profileManager.getSavedProfile();
      const storedUser = localStorage.getItem("user");
      const parsedStoredUser = storedUser ? JSON.parse(storedUser) : null;
      const authenticatedEmail = String(
        decoded?.email || parsedStoredUser?.email || "",
      )
        .toLowerCase()
        .trim();
      const savedProfileEmail = String(savedProfile?.email || "")
        .toLowerCase()
        .trim();
      const matchingSavedProfile =
        authenticatedEmail && savedProfileEmail === authenticatedEmail
          ? savedProfile
          : null;

      const normalizedRole = String(
        decoded?.role || parsedStoredUser?.role || "employee",
      ).toLowerCase();
      const normalizedRoles = Array.isArray(decoded?.roles)
        ? decoded.roles.map((role: string) => String(role).toLowerCase())
        : [normalizedRole];

      const bootUser: User = {
        id: String(decoded?.id || parsedStoredUser?.id || ""),
        name: parsedStoredUser?.name || matchingSavedProfile?.name || "User",
        email:
          decoded?.email ||
          matchingSavedProfile?.email ||
          parsedStoredUser?.email ||
          "",
        employee_id:
          parsedStoredUser?.employee_id ||
          parsedStoredUser?.employeeId ||
          matchingSavedProfile?.employee_id ||
          matchingSavedProfile?.employeeId,
        employeeId:
          parsedStoredUser?.employee_id ||
          parsedStoredUser?.employeeId ||
          matchingSavedProfile?.employee_id ||
          matchingSavedProfile?.employeeId,
        role: normalizedRole,
        roles: normalizedRoles.length ? normalizedRoles : [normalizedRole],
        companyName:
          parsedStoredUser?.companyName ||
          matchingSavedProfile?.companyName ||
          "Company",
        company_id:
          Number(
            decoded?.company_id ||
              parsedStoredUser?.company_id ||
              parsedStoredUser?.companyId,
          ) || undefined,
        companyId:
          Number(
            decoded?.company_id ||
              parsedStoredUser?.company_id ||
              parsedStoredUser?.companyId,
          ) || undefined,
        department: parsedStoredUser?.department || null,
        type: decoded?.type || parsedStoredUser?.type,
        avatar:
          parsedStoredUser?.avatar ||
          matchingSavedProfile?.avatar ||
          (decoded?.email
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${decoded.email}`
            : undefined),
      };

      await finalizeUserSession(bootUser, {
        rememberMe: localStorage.getItem("rememberMe") === "true",
      });

      return { success: true };
    } catch (error: any) {
      console.error("Auto login failed:", error);

      if (isRefreshFailureDefinitelyInvalid(error)) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        localStorage.removeItem("userRole");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem(SOFT_LOGOUT_PROMPT_KEY);
        clearRememberedAuthSession();
      }

      return {
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Session expired. Please login again.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem("user");
        const accessToken = localStorage.getItem("accessToken");
        const rememberedSession = getRememberedAuthSession();
        const shouldShowWelcomeBack =
          sessionStorage.getItem(SOFT_LOGOUT_PROMPT_KEY) === "true";

        if (storedUser && accessToken) {
          const normalizedStoredUser = normalizeUserAvatar(
            JSON.parse(storedUser),
          );
          setUser(normalizedStoredUser);
          localStorage.setItem("user", JSON.stringify(normalizedStoredUser));
          return;
        }

        if (
          rememberedSession?.rememberMe &&
          rememberedSession?.user &&
          rememberedSession?.accessToken
        ) {
          localStorage.setItem("user", JSON.stringify(rememberedSession.user));
          localStorage.setItem("accessToken", rememberedSession.accessToken);

          if (rememberedSession.refreshToken) {
            localStorage.setItem(
              "refreshToken",
              rememberedSession.refreshToken,
            );
            sessionStorage.removeItem("refreshToken");
          }

          setUser(normalizeUserAvatar(rememberedSession.user));
          return;
        }

        if (!shouldShowWelcomeBack && hasRefreshCredential()) {
          await autoLogin();
        }
      } catch (error) {
        console.error("Failed to initialize auth state", error);
        localStorage.removeItem("user");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("userRole");
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(normalizeUserAvatar(user)));
      registerWebPushNotifications().catch((error) => {
        console.warn("Web push registration skipped:", error);
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          await checkAndRefreshTokenIfNeeded();
        } catch (error) {
          console.error("Periodic token refresh failed:", error);
        }
      },
      4 * 60 * 1000,
    );

    return () => clearInterval(refreshInterval);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        try {
          await checkAndRefreshTokenIfNeeded();
          await registerWebPushNotifications();
        } catch (error) {
          console.error("Visibility change token refresh failed:", error);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [user]);

  useEffect(() => {
    const handleForceLogout = () => {
      if (
        typeof window !== "undefined" &&
        window.location.pathname === "/login"
      ) {
        return;
      }
      logout(false);
    };

    window.addEventListener("auth:logout", handleForceLogout);
    return () => window.removeEventListener("auth:logout", handleForceLogout);
  }, []);

  const login = async (
    email: string,
    password: string,
    rememberMe: boolean = false,
  ): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      if (!isValidLoginIdentifier(email)) {
        return {
          success: false,
          message: "Please enter a valid email address or mobile number.",
        };
      }

      const normalizedIdentifier = email.includes("@")
        ? normalizeEmail(email)
        : email.trim();
      const response = await ENDPOINTS.login(
        normalizedIdentifier,
        password,
      ).catch((error) => {
        console.error("API call failed:", error);
        throw new Error(
          error.response?.data?.message || "Failed to connect to the server",
        );
      });

      if (!response) {
        throw new Error("No response from server");
      }

      const responseData = response.data || {};
      if (responseData.message && !responseData.success) {
        throw new Error(responseData.message);
      }

      const accessToken = responseData.accessToken || responseData.token;
      if (!accessToken) {
        throw new Error("Invalid server response");
      }

      localStorage.setItem("accessToken", accessToken);
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("refreshToken");
      setReadableAuthCookie("accessToken", accessToken, 30 * 60);

      if (responseData.refreshToken) {
        localStorage.setItem("refreshToken", responseData.refreshToken);
        sessionStorage.removeItem("refreshToken");
        setReadableAuthCookie(
          "refreshToken",
          responseData.refreshToken,
          7 * 24 * 60 * 60,
        );
      }

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("rememberMe");
      }

      sessionStorage.removeItem(SOFT_LOGOUT_PROMPT_KEY);

      const normalizedRolesRaw: unknown[] = Array.isArray(
        responseData.user?.roles,
      )
        ? responseData.user.roles
        : [responseData.user?.role || responseData.role || "employee"];
      const normalizedRoles: string[] = [
        ...new Set(
          normalizedRolesRaw
            .filter(Boolean)
            .map((role) => String(role).toLowerCase()),
        ),
      ];

      const userData: User = {
        id: responseData.user?.id || responseData.id,
        name:
          responseData.user?.name ||
          responseData.name ||
          normalizedIdentifier.split("@")[0],
        email: responseData.user?.email || normalizedIdentifier,
        role: (
          responseData.user?.role ||
          responseData.role ||
          normalizedRoles[0] ||
          "employee"
        ).toLowerCase(),
        roles: normalizedRoles.length ? normalizedRoles : ["employee"],
        companyName:
          responseData.user?.companyName ||
          responseData.company_name ||
          "Company",
        company_id:
          Number(
            responseData.user?.company_id ||
              responseData.company_id ||
              decodeJwtPayload(accessToken)?.company_id,
          ) || undefined,
        companyId:
          Number(
            responseData.user?.company_id ||
              responseData.company_id ||
              decodeJwtPayload(accessToken)?.company_id,
          ) || undefined,
        department:
          responseData.user?.department || responseData.department || null,
        type: responseData.user?.type || responseData.type || undefined,
        avatar:
          resolveFileUrl(responseData.user?.avatar || responseData.avatar) ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${responseData.user?.email || normalizedIdentifier}`,
      };

      const resolvedUser = await finalizeUserSession(
        normalizeUserAvatar(userData) as User,
        { rememberMe },
      );

      if (rememberMe) {
        saveRememberedAuthSession({
          accessToken,
          refreshToken:
            responseData.refreshToken || getStoredRefreshToken() || undefined,
          user: resolvedUser,
          rememberMe: true,
        });
      } else {
        clearRememberedAuthSession();
      }

      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      const status = error.response?.status;
      const errorMessage =
        (status === 401 &&
          "Invalid email/mobile number or password. Please try again.") ||
        error.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (
    soft: boolean = false,
  ): Promise<{ success: boolean; message: string }> => {
    const preserveRefreshToken = localStorage.getItem("rememberMe") === "true";
    const rememberedRefreshToken = preserveRefreshToken
      ? getStoredRefreshToken() || undefined
      : undefined;
    const rememberedUser = preserveRefreshToken
      ? user || getRememberedAuthSession()?.user || undefined
      : undefined;

    const clearAuthData = () => {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      clearDebugCookies();

      if (preserveRefreshToken) {
        sessionStorage.setItem(SOFT_LOGOUT_PROMPT_KEY, "true");
        localStorage.setItem("rememberMe", "true");

        if (rememberedRefreshToken) {
          localStorage.setItem("refreshToken", rememberedRefreshToken);
          sessionStorage.removeItem("refreshToken");
          localStorage.setItem(
            AUTH_SESSION_KEY,
            JSON.stringify({
              refreshToken: rememberedRefreshToken,
              user: rememberedUser,
              rememberMe: true,
              savedAt: new Date().toISOString(),
            }),
          );
        }

        if (rememberedUser) {
          profileManager.saveProfile(rememberedUser, true);
        }
      } else {
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refreshToken");
        localStorage.removeItem("rememberMe");
        sessionStorage.removeItem(SOFT_LOGOUT_PROMPT_KEY);
        clearRememberedAuthSession();
        // Logging out of an unremembered account must preserve other saved accounts.
      }

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("auth_") || key.startsWith("user_")) {
          localStorage.removeItem(key);
        }
      });
    };

    let message = "Logged out successfully.";
    try {
      const response = await fetch(`${BASE_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
      });
      const data = await response.json().catch(() => null);
      message =
        data?.message ||
        (response.ok
          ? "Logged out successfully."
          : "Logout completed locally.");
    } catch (error) {
      console.warn(
        "Logout API call failed, but proceeding with local cleanup",
        error,
      );
    } finally {
      clearAuthData();
      storeLogoutFeedback(message);
      setUser(null);
      navigate("/login", { replace: true });
      unregisterStoredWebPushToken().catch((error) => {
        console.warn("Push token cleanup skipped after logout", error);
      });
    }

    return { success: true, message };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        login,
        autoLogin,
        logout,
        isLoading,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
