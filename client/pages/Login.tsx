import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader, ArrowRight, Eye, EyeOff } from "lucide-react";
import { showToast } from "@/utils/toast";
import logo from "../assets/logo.png";
import { profileManager } from "@/lib/profileManager";
import { isValidEmail, normalizeEmail } from "@/lib/validation";

const styles = `
  @keyframes fadeInDown {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-fade-in-down { animation: fadeInDown 0.6s ease-out; }
  .animate-fade-in-up { animation: fadeInUp 0.6s ease-out; }
  .animate-slide-in { animation: slideIn 0.6s ease-out; }
  .animate-float { animation: float 3s ease-in-out infinite; }
  .input-focus { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .input-focus:focus-within { transform: translateY(-2px); }
  .login-card { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .login-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15); }
  .button-press { transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
  .button-press:active { transform: scale(0.98); }
  @keyframes loginPageEnter {
    from { opacity: 0; transform: perspective(1200px) rotateX(30deg) translateY(40px); }
    to { opacity: 1; transform: perspective(1200px) rotateX(0deg) translateY(0); }
  }
  .login-page-container { animation: loginPageEnter 0.8s ease-out; }
  .register-button-spin { animation: rotateAndFadeOut 0.6s ease-in-out forwards; }
  @keyframes rotateAndFadeOut {
    0% { opacity: 1; transform: perspective(1000px) rotateY(0deg); }
    100% { opacity: 0; transform: perspective(1000px) rotateY(360deg); }
  }
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegisterClicked, setIsRegisterClicked] = useState(false);
  const [savedProfile, setSavedProfile] = useState<any>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const { login, autoLogin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const savedCredentials = profileManager.getSavedCredentials();
    const savedProfileData = profileManager.getSavedProfile();

    if (savedCredentials) {
      setEmail(savedCredentials.email);
      setRememberMe(savedCredentials.rememberMe);
    }

    if (savedProfileData) {
      setSavedProfile(savedProfileData);
      setShowLoginForm(false);
    } else {
      setShowLoginForm(true);
    }

    const authToast = sessionStorage.getItem("authToast");
    if (authToast) {
      try {
        const { type, message } = JSON.parse(authToast);
        if (type === "success" && message) {
          showToast.success(message);
        }
      } catch (error) {
        console.warn("Failed to parse auth toast message", error);
      } finally {
        sessionStorage.removeItem("authToast");
      }
    }
  }, []);

  const handleRegisterClick = () => {
    setIsRegisterClicked(true);
    setTimeout(() => {
      navigate("/signup");
    }, 600);
  };

  const navigateAfterLogin = () => {
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "null");
    const isSuperAdmin =
      loggedInUser?.roles?.some(
        (role: string) => role?.toLowerCase() === "superadmin"
      ) || loggedInUser?.role?.toLowerCase() === "superadmin";

    navigate(isSuperAdmin ? "/superadmin-dashboard" : "/dashboard", {
      replace: true,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidEmail(email)) {
      showToast.error("Please enter a valid email address.");
      return;
    }

    try {
      const normalizedEmail = normalizeEmail(email);
      const result = await login(normalizedEmail, password, rememberMe);
      if (result.success) {
        if (rememberMe) {
          profileManager.saveCredentials(normalizedEmail, true);
        } else {
          profileManager.clearSavedCredentials();
          profileManager.clearSavedProfile();
        }

        showToast.success("Login successful! Redirecting...");
        navigateAfterLogin();
      } else {
        showToast.error(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      showToast.error("An error occurred during login. Please try again.");
      if (savedProfile) {
        setEmail(savedProfile.email);
        setRememberMe(true);
        setShowLoginForm(true);
      }
    }
  };

  const handleClearSavedProfile = () => {
    profileManager.clearAll();
    setSavedProfile(null);
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setShowLoginForm(true);
    showToast.success("Saved profile cleared successfully.");
  };

  const handleYesThisIsMe = async () => {
    if (!savedProfile?.email) return;

    try {
      setIsAutoLoggingIn(true);
      const result = await autoLogin();
      if (result.success) {
        showToast.success("Welcome back! Login successful!");
        navigateAfterLogin();
      } else {
        showToast.info("Please enter your password to continue.");
        setEmail(savedProfile.email);
        setRememberMe(true);
        setShowLoginForm(true);
      }
    } catch (error) {
      showToast.error("Auto-login failed. Please enter your credentials manually.");
      setEmail(savedProfile.email);
      setRememberMe(true);
      setShowLoginForm(true);
    } finally {
      setIsAutoLoggingIn(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div
          className="absolute -bottom-8 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="w-full max-w-md relative z-10 login-page-container">
          <div className="text-center mb-8 animate-fade-in-down">
            <div
              className="w-48 h-48 flex items-center justify-center mx-auto mb-2 animate-float cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => navigate("/")}
            >
              <img
                src={logo}
                alt="HRMS Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>

          <Card className="border-0 shadow-2xl login-card animate-fade-in-up">
            {!showLoginForm && savedProfile ? (
              <>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold text-slate-800">
                    Welcome Back
                  </CardTitle>
                  <CardDescription className="text-slate-500">
                    Sign in to your HRMS account to continue
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {savedProfile.avatar ? (
                          <img
                            src={savedProfile.avatar}
                            alt={savedProfile.name || "User"}
                            className="w-14 h-14 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-blue-600 font-semibold text-xl">
                            {(savedProfile.name || savedProfile.email || "U")
                              .charAt(0)
                              .toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-lg truncate">
                          {savedProfile.name || "User"}
                        </p>
                        <p className="text-sm text-slate-500 truncate">
                          {savedProfile.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleYesThisIsMe}
                    className="w-full button-press bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg transition-all duration-300 mb-4"
                    disabled={isLoading || isAutoLoggingIn}
                  >
                    {isAutoLoggingIn ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Yes, this is me
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowLoginForm(true)}
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Sign into another account
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearSavedProfile}
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your email and password to access the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div
                      className="space-y-2 animate-slide-in"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <Label htmlFor="email" className="text-slate-700">
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        className="input-focus border-slate-200 focus:border-primary focus:ring-primary/10 bg-white"
                      />
                    </div>

                    <div
                      className="space-y-2 animate-slide-in"
                      style={{ animationDelay: "0.2s" }}
                    >
                      <Label htmlFor="password" className="text-slate-700">
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          disabled={isLoading}
                          className="input-focus border-slate-200 focus:border-primary focus:ring-primary/10 bg-white pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => navigate("/forgot-password")}
                          className="text-xs text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between animate-slide-in"
                      style={{ animationDelay: "0.25s" }}
                    >
                      <label className="flex items-center gap-2 text-sm text-slate-700 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          disabled={isLoading}
                          className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                        />
                        Remember me
                      </label>
                    </div>

                    <Button
                      type="submit"
                      className="w-full button-press bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-white font-medium animate-fade-in-up"
                      style={{ animationDelay: "0.3s" }}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader className="w-4 h-4 mr-2 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          Login
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <div
                      className={`text-center pt-4 animate-fade-in-up ${
                        isRegisterClicked ? "register-button-spin" : ""
                      }`}
                      style={{ animationDelay: "0.4s" }}
                    >
                      <p className="text-sm text-slate-600">
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={handleRegisterClick}
                          className="font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors inline-flex items-center gap-1"
                          disabled={isRegisterClicked}
                        >
                          Register here
                          {isRegisterClicked && (
                            <span className="inline-block animate-spin">*</span>
                          )}
                        </button>
                      </p>
                    </div>
                  </form>
                </CardContent>
              </>
            )}
          </Card>

          <p
            className="text-center text-sm text-slate-600 mt-8 animate-fade-in-up"
            style={{ animationDelay: "1.1s" }}
          >
            &copy; {new Date().getFullYear()} Procease HRMS System. All rights
            reserved.
          </p>
        </div>
      </div>
    </>
  );
}
