import React, { useEffect, useRef, useState } from "react";
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
import {
  Loader,
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  UnlockKeyhole,
} from "lucide-react";
import { showToast } from "@/utils/toast";
import logo from "../assets/logo.png";
import { profileManager, SavedAccount } from "@/lib/profileManager";
import { isValidLoginIdentifier, normalizeEmail } from "@/lib/validation";
import { isCordovaIOS } from "@/lib/platform";
import { hasRefreshCredential, isAutoLoginPaused } from "@/lib/endpoint";

const LOGIN_UNLOCK_KEY = "auth:loginUnlocking";

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
  @keyframes unlockBackdrop {
    0% { opacity: 0; backdrop-filter: blur(0px); }
    16% { opacity: 1; backdrop-filter: blur(10px); }
    100% { opacity: 1; backdrop-filter: blur(18px); }
  }
  @keyframes unlockCard {
    0% { opacity: 0; transform: perspective(900px) rotateX(28deg) translateY(28px) scale(0.86); }
    28% { opacity: 1; transform: perspective(900px) rotateX(0deg) translateY(0) scale(1); }
    64% { transform: perspective(900px) rotateX(0deg) translateY(-8px) scale(1.04); }
    100% { opacity: 0; transform: perspective(900px) rotateX(-22deg) translateY(-90px) scale(1.24); }
  }
  @keyframes lockShackle {
    0%, 24% { transform: translateY(0) rotate(0deg); opacity: 1; }
    45% { transform: translateY(-12px) rotate(-24deg); opacity: 1; }
    100% { transform: translateY(-34px) rotate(-42deg); opacity: 0; }
  }
  @keyframes unlockGlow {
    0% { transform: scale(0.45); opacity: 0; }
    34% { transform: scale(1); opacity: 0.95; }
    100% { transform: scale(3.2); opacity: 0; }
  }
  @keyframes enterSweep {
    0% { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
    35% { opacity: 0.85; }
    100% { transform: translateX(130%) skewX(-18deg); opacity: 0; }
  }
  @keyframes unlockText {
    0% { opacity: 0; transform: translateY(12px); }
    28%, 74% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-18px); }
  }
  .unlock-backdrop { animation: unlockBackdrop 1.35s ease forwards; }
  .unlock-card { animation: unlockCard 1.35s cubic-bezier(0.2, 0.9, 0.2, 1) forwards; }
  .unlock-shackle { transform-origin: 60% 46%; animation: lockShackle 1.05s ease-in forwards; }
  .unlock-glow { animation: unlockGlow 1.25s ease-out forwards; }
  .enter-sweep { animation: enterSweep 1.05s ease-in-out forwards; }
  .unlock-text { animation: unlockText 1.2s ease forwards; }
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isRegisterClicked, setIsRegisterClicked] = useState(false);
  const [savedProfile, setSavedProfile] = useState<any>(null);
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isAutoLoggingIn, setIsAutoLoggingIn] = useState(false);
  const [attemptedSessionRestore, setAttemptedSessionRestore] = useState(false);
  const [accountChooserReady, setAccountChooserReady] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const holdAuthRedirectRef = useRef(false);
  const { login, autoLogin, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const hideRegistration = isCordovaIOS();

  useEffect(() => {
    const savedCredentials = profileManager.getSavedCredentials();
    const savedProfileData = profileManager.getSavedProfile();
    let accounts = profileManager.getSavedAccounts();
    if (!accounts.length && savedProfileData) {
      accounts = profileManager.saveAccountSession(
        savedProfileData,
        localStorage.getItem("refreshToken") || undefined,
      );
    }
    setSavedAccounts(accounts);

    if (savedCredentials) {
      setEmail(savedCredentials.email);
      setRememberMe(savedCredentials.rememberMe);
    }

    if (accounts.length) {
      setSavedProfile(accounts[0]);
      setShowLoginForm(false);
    } else {
      setShowLoginForm(true);
    }
    setAccountChooserReady(true);

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
    if (hideRegistration) return;

    setIsRegisterClicked(true);
    setTimeout(() => {
      navigate("/signup");
    }, 600);
  };

  const navigateAfterLogin = () => {
    const loggedInUser = JSON.parse(localStorage.getItem("user") || "null");
    const isSuperAdmin =
      loggedInUser?.roles?.some(
        (role: string) => role?.toLowerCase() === "superadmin",
      ) || loggedInUser?.role?.toLowerCase() === "superadmin";

    navigate(isSuperAdmin ? "/superadmin-dashboard" : "/dashboard", {
      replace: true,
    });
  };

  const playUnlockAnimationThenNavigate = () => {
    holdAuthRedirectRef.current = true;
    sessionStorage.setItem(LOGIN_UNLOCK_KEY, "true");
    setIsUnlocking(true);
    window.setTimeout(() => {
      holdAuthRedirectRef.current = false;
      sessionStorage.removeItem(LOGIN_UNLOCK_KEY);
      navigateAfterLogin();
    }, 1180);
  };

  useEffect(() => {
    if (!accountChooserReady) return;
    if (isLoading) return;

    if (isAuthenticated) {
      if (holdAuthRedirectRef.current || isUnlocking) return;
      navigateAfterLogin();
      return;
    }

    if (attemptedSessionRestore) return;

    // Remembered accounts must be selected explicitly, like Gmail's chooser.
    if (savedAccounts.length) return;

    const hasRememberedSession = hasRefreshCredential() && !isAutoLoginPaused();

    if (!hasRememberedSession) return;

    const restoreSession = async () => {
      setAttemptedSessionRestore(true);
      holdAuthRedirectRef.current = true;
      sessionStorage.setItem(LOGIN_UNLOCK_KEY, "true");
      setIsAutoLoggingIn(true);

      try {
        const result = await autoLogin();
        if (result.success) {
          showToast.success("Welcome back! Unlocking workspace...");
          playUnlockAnimationThenNavigate();
        } else {
          holdAuthRedirectRef.current = false;
          sessionStorage.removeItem(LOGIN_UNLOCK_KEY);
        }
      } catch (error) {
        holdAuthRedirectRef.current = false;
        sessionStorage.removeItem(LOGIN_UNLOCK_KEY);
      } finally {
        setIsAutoLoggingIn(false);
      }
    };

    restoreSession();
  }, [
    isAuthenticated,
    isLoading,
    attemptedSessionRestore,
    accountChooserReady,
    savedAccounts.length,
  ]);

  const handleSignIntoAnotherAccount = () => {
    setEmail("");
    setPassword("");
    setRememberMe(true);
    setShowLoginForm(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidLoginIdentifier(email)) {
      showToast.error("Please enter a valid email address or mobile number.");
      return;
    }

    try {
      holdAuthRedirectRef.current = true;
      sessionStorage.setItem(LOGIN_UNLOCK_KEY, "true");
      const normalizedIdentifier = email.includes("@")
        ? normalizeEmail(email)
        : email.trim();
      const result = await login(normalizedIdentifier, password, rememberMe);
      if (result.success) {
        if (rememberMe) {
          profileManager.saveCredentials(normalizedIdentifier, true);
          const loggedInUser = JSON.parse(
            localStorage.getItem("user") || "null",
          );
          const accounts = profileManager.saveAccountSession(
            loggedInUser,
            localStorage.getItem("refreshToken") || undefined,
          );
          setSavedAccounts(accounts);
        } else {
          profileManager.clearSavedCredentials();
          profileManager.clearSavedProfile();
        }

        showToast.success("Login successful! Unlocking workspace...");
        playUnlockAnimationThenNavigate();
      } else {
        holdAuthRedirectRef.current = false;
        sessionStorage.removeItem(LOGIN_UNLOCK_KEY);
        showToast.error(result.message || "Login failed. Please try again.");
      }
    } catch (error) {
      holdAuthRedirectRef.current = false;
      sessionStorage.removeItem(LOGIN_UNLOCK_KEY);
      showToast.error("An error occurred during login. Please try again.");
      if (savedProfile) {
        setEmail(savedProfile.email);
        setRememberMe(true);
        setShowLoginForm(true);
      }
    }
  };

  const handleClearSavedProfile = () => {
    if (!savedProfile?.email) return;
    const accounts = profileManager.removeSavedAccount(savedProfile.email);
    localStorage.removeItem("auth:session");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("refreshToken");
    setAttemptedSessionRestore(true);
    setSavedAccounts(accounts);
    setSavedProfile(accounts[0] || null);
    setEmail("");
    setPassword("");
    setRememberMe(false);
    setShowLoginForm(accounts.length === 0);
    showToast.success("Saved account removed.");
  };

  const handleYesThisIsMe = async (selectedAccount?: SavedAccount) => {
    const account = selectedAccount || savedProfile;
    if (!account?.email) return;
    setSavedProfile(account);

    if (account.refreshToken) {
      localStorage.setItem("refreshToken", account.refreshToken);
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("user", JSON.stringify(account.user || account));
      localStorage.setItem(
        "auth:session",
        JSON.stringify({
          refreshToken: account.refreshToken,
          user: account.user || account,
          rememberMe: true,
        }),
      );
    } else {
      localStorage.removeItem("refreshToken");
      sessionStorage.removeItem("refreshToken");
      localStorage.removeItem("auth:session");
    }

    if (!hasRefreshCredential()) {
      showToast.info("Please enter your password to continue.");
      setEmail(account.email);
      setRememberMe(true);
      setShowLoginForm(true);
      return;
    }

    try {
      sessionStorage.removeItem("auth:showWelcomeBack");
      holdAuthRedirectRef.current = true;
      sessionStorage.setItem(LOGIN_UNLOCK_KEY, "true");
      setIsAutoLoggingIn(true);
      const result = await autoLogin();
      if (result.success) {
        showToast.success("Welcome back! Unlocking workspace...");
        playUnlockAnimationThenNavigate();
      } else {
        holdAuthRedirectRef.current = false;
        sessionStorage.removeItem(LOGIN_UNLOCK_KEY);
        showToast.info("Please enter your password to continue.");
        setEmail(account.email);
        setRememberMe(true);
        setShowLoginForm(true);
      }
    } catch (error) {
      holdAuthRedirectRef.current = false;
      sessionStorage.removeItem(LOGIN_UNLOCK_KEY);
      showToast.error(
        "Auto-login failed. Please enter your credentials manually.",
      );
      setEmail(account.email);
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

        {isUnlocking && (
          <div className="fixed inset-0 z-50 unlock-backdrop bg-[#041f1a]/70 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-[#17c491]/60 to-transparent enter-sweep" />
            <div className="absolute h-56 w-56 rounded-full bg-[#17c491]/35 blur-3xl unlock-glow" />
            <div className="relative unlock-card flex flex-col items-center gap-5">
              <div className="relative h-32 w-32 rounded-full bg-white/95 shadow-[0_0_70px_rgba(23,196,145,0.55)] flex items-center justify-center border border-[#bdf4df]">
                <LockKeyhole className="h-16 w-16 text-[#064f3f]" />
                <UnlockKeyhole className="unlock-shackle absolute h-16 w-16 text-[#17c491]" />
              </div>
              <div className="unlock-text text-center">
                <p className="text-2xl font-bold text-white">Access Unlocked</p>
                <p className="text-sm text-[#d8fff3]">
                  Entering HRMS workspace...
                </p>
              </div>
            </div>
          </div>
        )}

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
                  <div className="space-y-2 mb-6 max-h-72 overflow-y-auto pr-1">
                    {savedAccounts.map((account) => (
                      <button
                        type="button"
                        key={account.email}
                        onClick={() => handleYesThisIsMe(account)}
                        className={`w-full text-left border rounded-xl p-4 transition-colors ${
                          savedProfile?.email === account.email
                            ? "bg-blue-50 border-blue-400"
                            : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {account.avatar ? (
                              <img
                                src={account.avatar}
                                alt={account.name || "User"}
                                className="w-14 h-14 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-blue-600 font-semibold text-xl">
                                {(account.name || account.email || "U")
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-800 text-lg truncate">
                              {account.name || "User"}
                            </p>
                            <p className="text-sm text-slate-500 truncate">
                              {account.email}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleYesThisIsMe()}
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
                      onClick={handleSignIntoAnotherAccount}
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Sign into another account
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleClearSavedProfile}
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>
                    Enter your email or mobile number and password
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div
                      className="space-y-2 animate-slide-in"
                      style={{ animationDelay: "0.1s" }}
                    >
                      <Label htmlFor="email" className="text-slate-700">
                        Email or Mobile Number
                      </Label>
                      <Input
                        id="email"
                        type="text"
                        autoComplete="username"
                        placeholder="Enter email or mobile number"
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

                    {!hideRegistration && (
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
                              <span className="inline-block animate-spin">
                                *
                              </span>
                            )}
                          </button>
                        </p>
                      </div>
                    )}
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
