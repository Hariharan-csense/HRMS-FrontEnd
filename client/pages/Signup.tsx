import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole, User } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader, ChevronLeft } from "lucide-react";
import { registerUser } from "@/components/helper/register";

const signupStyles = `
  @keyframes rotateInFromRight {
    from {
      opacity: 0;
      transform: perspective(1000px) rotateY(-90deg);
    }
    to {
      opacity: 1;
      transform: perspective(1000px) rotateY(0deg);
    }
  }

  @keyframes rotateOutToLeft {
    from {
      opacity: 1;
      transform: perspective(1000px) rotateY(0deg);
    }
    to {
      opacity: 0;
      transform: perspective(1000px) rotateY(90deg);
    }
  }

  .signup-page-enter {
    animation: rotateInFromRight 0.7s ease-out;
    transform-origin: center;
  }

  .signup-back-spin {
    animation: rotateOutToLeft 0.7s ease-in-out forwards;
  }

  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .form-field-enter {
    animation: slideInFromRight 0.5s ease-out backwards;
  }

  .signup-card {
    transform-origin: center;
  }
`;

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isBackClicked, setIsBackClicked] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    role: "employee" as "employee" | "admin",
    department: "Engineering",
    termsAccepted: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageEntered, setPageEntered] = useState(false);

  useEffect(() => {
    setPageEntered(true);
  }, []);

  const handleBackClick = () => {
    setIsBackClicked(true);
    setTimeout(() => {
      navigate("/login");
    }, 700);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.name.trim()) {
      setError("Full name is required");
      return;
    }
    if (!formData.companyName.trim()) {
      setError("Company name is required");
      return;
    }
    if (!formData.email.trim()) {
      setError("Email address is required");
      return;
    }
    if (!formData.password) {
      setError("Password is required");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!formData.termsAccepted) {
      setError("You must agree to the Terms of Service");
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare user data for registration
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        companyName: formData.companyName,
        role: formData.role,
        department: formData.role === "admin" ? "Management" : formData.department,
        // Add any other required fields here
      };

      // Call the registration API
      const result = await registerUser(userData);
      
      if (!result.success) {
        throw new Error(result.error || 'Registration failed');
      }

      // If admin, auto-login and redirect to dashboard
      if (formData.role === "admin") {
        try {
          // Normalize email (trim + lowercase) to match backend storage
          const normalizedEmail = formData.email.trim().toLowerCase();
          await login(normalizedEmail, formData.password);
          setSuccess("Admin account created! Redirecting to dashboard...");
          setTimeout(() => {
            navigate("/dashboard");
          }, 1500);
          return;
        } catch (err) {
          console.error("Auto-login failed:", err);
          setSuccess("Account created! Please login with your credentials.");
          setTimeout(() => {
            navigate("/login");
          }, 2000);
          return;
        }
      }

      // For employees, redirect to login
      setSuccess("Account created successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        companyName: "",
        role: "employee",
        department: "Engineering",
        termsAccepted: false,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{signupStyles}</style>
      <div className={`min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center p-4 ${isBackClicked ? "signup-back-spin" : ""}`}>
        <div className="w-full max-w-md signup-page-enter">
          {/* Header */}
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={handleBackClick}
              className="p-2 -ml-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
              disabled={isBackClicked}
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Get Started</h1>
            </div>
          </div>

          {/* Registration Card */}
          <Card className="border-0 shadow-lg signup-card">
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <AlertCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.3s" }}>
                <Label htmlFor="name" className="text-slate-900 font-medium">
                  Your Full Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              {/* Company Name */}
              <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.35s" }}>
                <Label htmlFor="companyName" className="text-slate-900 font-medium">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  name="companyName"
                  type="text"
                  placeholder="Your Company Name"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              {/* Email */}
              <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.4s" }}>
                <Label htmlFor="email" className="text-slate-900 font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.5s" }}>
                <Label htmlFor="role" className="text-slate-900 font-medium">
                  Account Type
                </Label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Password */}
              <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.6s" }}>
                <Label htmlFor="password" className="text-slate-900 font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              {/* Confirm Password */}
              <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.7s" }}>
                <Label htmlFor="confirmPassword" className="text-slate-900 font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="bg-slate-50 border-slate-200"
                />
              </div>

              {/* Terms Agreement */}
              <div className="flex items-start gap-3 pt-2 form-field-enter" style={{ animationDelay: "0.8s" }}>
                <input
                  id="terms"
                  name="termsAccepted"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className="mt-1 w-5 h-5 border-2 border-slate-300 rounded cursor-pointer accent-teal-600"
                />
                <label htmlFor="terms" className="text-sm text-slate-600 cursor-pointer">
                  I agree to the{" "}
                  <a href="#" className="font-medium text-teal-600 hover:underline">
                    Terms of Service
                  </a>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-3 text-base form-field-enter"
                style={{ animationDelay: "0.9s" }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Get Started
                    <span className="ml-2">→</span>
                  </>
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4 form-field-enter" style={{ animationDelay: "1.0s" }}>
                <p className="text-sm text-slate-600">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="font-semibold text-teal-600 hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 mt-8">
          © HRMS System. All rights reserved.
        </p>
      </div>
    </div>
    </>
  );
}
