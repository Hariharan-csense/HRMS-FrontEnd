import React, { useState, useEffect, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, ArrowRight } from "lucide-react";
import { handleLogin } from '../components/helper/login/login';
import { showToast } from '@/utils/toast';  
import logo from "../assets/logo.png";
const styles = `
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes shimmer {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  .animate-fade-in-down {
    animation: fadeInDown 0.6s ease-out;
  }

  .animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out;
  }

  .animate-slide-in {
    animation: slideIn 0.6s ease-out;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .input-focus {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .input-focus:focus-within {
    transform: translateY(-2px);
  }

  .demo-account-hover {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .demo-account-hover:hover {
    transform: translateX(4px);
    border-color: hsl(var(--primary));
    background-color: hsl(var(--primary) / 0.05);
  }

  .login-card {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .login-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
  }

  .button-press {
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .button-press:active {
    transform: scale(0.98);
  }

  @keyframes loginPageEnter {
    from {
      opacity: 0;
      transform: perspective(1200px) rotateX(30deg) translateY(40px);
    }
    to {
      opacity: 1;
      transform: perspective(1200px) rotateX(0deg) translateY(0);
    }
  }

  .login-page-container {
    animation: loginPageEnter 0.8s ease-out;
  }

  @keyframes rotateAndFadeOut {
    0% {
      opacity: 1;
      transform: perspective(1000px) rotateY(0deg);
    }
    100% {
      opacity: 0;
      transform: perspective(1000px) rotateY(360deg);
    }
  }

  .register-button-spin {
    animation: rotateAndFadeOut 0.6s ease-in-out forwards;
  }

  @keyframes pageSlideIn {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .signup-page-enter {
    animation: pageSlideIn 0.6s ease-out;
  }
`;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegisterClicked, setIsRegisterClicked] = useState(false);
  const [pageEntered, setPageEntered] = useState(false);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPageEntered(true);
  }, []);

  const handleRegisterClick = () => {
    setIsRegisterClicked(true);
    setTimeout(() => {
      navigate("/signup");
    }, 600);
  };
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  
  try {
    const result: { success: boolean; message?: string } = await login(email, password);
    if (result.success) {
      showToast.success("Login successful! Redirecting...");
      
      // Always redirect to dashboard for successful login
      navigate("/dashboard");
    } else {
      showToast.error(result.message || "Login failed. Please try again.");
    }
  } catch (error) {
    showToast.error("An error occurred during login. Please try again.");
    console.error("Login error:", error);
  }
};

    
  const demoAccounts = [
    { email: "admin@company.com", password: "admin123", role: "Admin" },
    { email: "employee@company.com", password: "emp123", role: "Employee" },
    { email: "manager@company.com", password: "mgr123", role: "Manager" },
    { email: "hr@company.com", password: "hr123", role: "HR" },
    { email: "finance@company.com", password: "fin123", role: "Finance" },
  ];

  const fillDemoAccount = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-8 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "2s" }}></div>

        <div className="w-full max-w-md relative z-10 login-page-container">
          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-down">
            <div 
              className="w-48 h-48 flex items-center justify-center mx-auto mb-2 animate-float cursor-pointer hover:scale-105 transition-transform duration-300"
              onClick={() => navigate("/landing")}
            >
              <img 
                src={logo}
                alt="HRMS Logo" 
                className="w-full h-full object-contain p-2"
              />
            </div>
            {/* <p className="text-slate-600 text-sm">Human Resource Management System</p> */}
          </div>

          {/* Login Card */}
          <Card className="border-0 shadow-2xl login-card animate-fade-in-up">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Enter your email and password to access the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.1s" }}>
                <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="virat@bcci.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-focus border-slate-200 focus:border-primary focus:ring-primary/10 bg-white"
                />
              </div>

              <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.2s" }}>
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="input-focus border-slate-200 focus:border-primary focus:ring-primary/10 bg-white"
                />
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

              <div className={`text-center pt-4 animate-fade-in-up ${isRegisterClicked ? "register-button-spin" : ""}`} style={{ animationDelay: "0.4s" }}>
                <p className="text-sm text-slate-600">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={handleRegisterClick}
                    className="font-medium text-teal-600 hover:text-teal-700 hover:underline transition-colors inline-flex items-center gap-1"
                    disabled={isRegisterClicked}
                  >
                    Register here
                    {isRegisterClicked && <span className="inline-block animate-spin">↻</span>}
                  </button>
                </p>
              </div>
            </form>

            {/* Demo Accounts */}
            
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-slate-600 mt-8 animate-fade-in-up" style={{ animationDelay: "1.1s" }}>
          © {new Date().getFullYear()} Procease HRMS System. All rights reserved.
        </p>
      </div>
    </div>
    </>
  );
}
