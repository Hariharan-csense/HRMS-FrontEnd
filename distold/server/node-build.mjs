import path from "path";
import "dotenv/config";
import * as express from "express";
import express__default from "express";
import cors from "cors";
import axios from "axios";
const handleDemo = (req, res) => {
  const response = {
    message: "Hello from Express server"
  };
  res.status(200).json(response);
};
const BASE_URL = "https://hrms.procease.co/backend";
axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json"
  }
});
const clearAuthStorage = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  sessionStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("userRole");
  localStorage.removeItem("rememberMe");
};
const getStoredRefreshToken = () => localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");
const persistRefreshToken = (refreshToken) => {
  const rememberMe = localStorage.getItem("rememberMe") === "true";
  if (rememberMe) {
    localStorage.setItem("refreshToken", refreshToken);
    sessionStorage.removeItem("refreshToken");
    return;
  }
  sessionStorage.setItem("refreshToken", refreshToken);
  localStorage.removeItem("refreshToken");
};
const setReadableAuthCookie = (name, value, maxAgeSeconds) => {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
};
const clearReadableDebugCookies = () => {
  if (typeof document === "undefined") return;
  document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "accessTokenDebug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "refreshTokenDebug=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
};
api.interceptors.request.use(
  async (config) => {
    const requestUrl = typeof config.url === "string" ? config.url : "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh-token");
    if (isRefreshRequest) {
      return config;
    }
    await checkAndRefreshTokenIfNeeded();
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
let refreshPromise = null;
const refreshAccessToken = async () => {
  try {
    const storedRefreshToken = getStoredRefreshToken();
    const response = await axios.post(
      `${BASE_URL}/api/auth/refresh-token`,
      storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
      {
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json"
        }
      }
    );
    const newAccessToken = response.data?.accessToken || response.data?.token;
    const newRefreshToken = response.data?.refreshToken;
    if (!newAccessToken) {
      throw new Error("No access token returned from refresh");
    }
    localStorage.setItem("accessToken", newAccessToken);
    setReadableAuthCookie("accessToken", newAccessToken, 30 * 60);
    if (newRefreshToken) {
      persistRefreshToken(newRefreshToken);
      setReadableAuthCookie("refreshToken", newRefreshToken, 7 * 24 * 60 * 60);
    }
    console.log("Access token refreshed successfully");
    return newAccessToken;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};
const isTokenExpiredOrExpiringSoon = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1e3);
    const expirationTime = payload.exp;
    const fiveMinutesFromNow = currentTime + 5 * 60;
    return expirationTime <= fiveMinutesFromNow;
  } catch (error) {
    console.error("Error checking token expiration:", error);
    return true;
  }
};
const checkAndRefreshTokenIfNeeded = async () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    return;
  }
  if (isTokenExpiredOrExpiringSoon(token)) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    try {
      await refreshPromise;
    } catch (error) {
      console.error("Proactive token refresh failed:", error);
    }
  }
};
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const requestUrl = typeof originalRequest?.url === "string" ? originalRequest.url : "";
    if (status === 401 && requestUrl.includes("/auth/login")) {
      return Promise.reject(error);
    }
    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (typeof originalRequest.url === "string" && !originalRequest.url.includes("/auth/refresh-token")) {
        originalRequest._retry = true;
        try {
          if (!refreshPromise) {
            refreshPromise = refreshAccessToken().finally(() => {
              refreshPromise = null;
            });
          }
          const newAccessToken = await refreshPromise;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error(
            "Token refresh failed during 401 handling:",
            refreshError
          );
          clearAuthStorage();
          clearReadableDebugCookies();
          return Promise.reject(refreshError);
        }
      } else {
        clearAuthStorage();
        clearReadableDebugCookies();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
function createServer() {
  const app2 = express__default();
  app2.use(cors());
  app2.use(express__default.json());
  app2.use(express__default.urlencoded({ extended: true }));
  app2.use(express__default.static(path.join(__dirname, "../public")));
  app2.get("/api/role", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const response = await fetch(`${BASE_URL}/api/role`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  app2.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app2.get("/api/demo", handleDemo);
  return app2;
}
const app = createServer();
const port = process.env.PORT || 3e3;
const __dirname$1 = import.meta.dirname;
const distPath = path.join(__dirname$1, "../spa");
app.use(express.static(distPath));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/") || req.path.startsWith("/health")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});
app.listen(port, () => {
  console.log(`🚀 Fusion Starter server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
  console.log(`🔧 API: http://localhost:${port}/api`);
});
process.on("SIGTERM", () => {
  console.log("🛑 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});
process.on("SIGINT", () => {
  console.log("🛑 Received SIGINT, shutting down gracefully");
  process.exit(0);
});
//# sourceMappingURL=node-build.mjs.map
