import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader, ChevronLeft, Eye, Phone, EyeOff, Check, X, Shield, Users, Building, Mail, Lock, User } from "lucide-react";
import { registerUser } from "@/components/helper/register";
import logo from "../assets/logo.png";

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

  .password-strength-bar {
    height: 6px;
    border-radius: 9999px;
    overflow: hidden;
    background: rgb(226 232 240); /* slate-200 */
  }

  .password-strength-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 200ms ease, background-color 200ms ease;
  }

  .input-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    pointer-events: none;
  }

  .input-with-icon {
    padding-left: 40px;
  }

  .feature-highlight {
    background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%);
    border: 1px solid #5eead4;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 16px;
  }

  .requirement-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
  }

  .requirement-met {
    color: #059669;
  }

  .requirement-not-met {
    color: #dc2626;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .loading-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;

const DEPARTMENTS = [
  "Engineering",
  "Human Resources",
  "Finance",
  "Sales",
  "Marketing",
  "Operations",
  "IT",
  "Support",
] as const;

function scorePasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const clamped = Math.min(score, 5);
  const percent = (clamped / 5) * 100;
  const label =
    clamped <= 1 ? "Weak" : clamped <= 3 ? "Okay" : clamped === 4 ? "Good" : "Strong";
  const color =
    clamped <= 1
      ? "rgb(239 68 68)" // red-500
      : clamped <= 3
        ? "rgb(245 158 11)" // amber-500
        : clamped === 4
          ? "rgb(34 197 94)" // green-500
          : "rgb(20 184 166)"; // teal-500

  return { score: clamped, percent, label, color };
}

function getPasswordRequirements(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isBackClicked, setIsBackClicked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone:"",
    confirmPassword: "",
    companyName: "",
    role: "admin",
    department: "Management",
    termsAccepted: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [pageEntered, setPageEntered] = useState(false);

  useEffect(() => {
    setPageEntered(true);
    document.title = "Sign up • HRMS";
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
      ...(name === "role"
        ? {
            department:
              value === "admin"
                ? "Management"
                : prev.department === "Management"
                  ? "Engineering"
                  : prev.department,
          }
        : null),
    }));
    setError("");
  };

  const passwordStrength = useMemo(
    () => scorePasswordStrength(formData.password),
    [formData.password]
  );

  const passwordRequirements = useMemo(
    () => getPasswordRequirements(formData.password),
    [formData.password]
  );

  const isSubmitDisabled =
    isLoading ||
    isBackClicked ||
    !formData.name.trim() ||
    !formData.companyName.trim() ||
    !formData.email.trim() ||
    !formData.password ||
    !formData.confirmPassword ||
    !formData.termsAccepted;

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
        phone: formData.phone,
        department: formData.department === "Management" ? "Management" : formData.department,
        // Add any other required fields here
      };

      // Call the registration API
      const result = await registerUser(userData);
      
      if (!result.success) {
        throw new Error(result.error || "Registration failed");
      }

      // If admin, auto-login and redirect to dashboard
      if (formData.role === "admin") {
        try {
          // Normalize email (trim + lowercase) to match backend storage
          const normalizedEmail = formData.email.trim().toLowerCase();
          await login(normalizedEmail, formData.password, true);
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
        phone: "",
        confirmPassword: "",
        companyName: "",
        role: "employee",
        department: "Engineering",
        termsAccepted: false,
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{signupStyles}</style>
      <div className={`min-h-screen bg-gradient-to-br from-teal-50 to-teal-100 flex ${isBackClicked ? "signup-back-spin" : ""}`}>
        {/* Left Side - Logo and Branding */}
        <div className={`hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 to-teal-800 items-center justify-center p-8 ${pageEntered ? "signup-page-enter" : ""}`}>
          <div className="text-center text-white">
            <img
              src={logo}
              alt="HRMS"
              className="w-32 h-32 mx-auto mb-8 rounded-2xl bg-white shadow-2xl p-4"
              onError={(e) => {
                e.currentTarget.src = "/favicon.png";
              }}
            />
            <h1 className="text-4xl font-bold mb-4">Welcome to HRMS</h1>
            <p className="text-xl text-teal-100 mb-8">Transform your workforce management</p>
            
            <div className="space-y-6 text-left max-w-md mx-auto">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Team Management</h3>
                  <p className="text-teal-200 text-sm">Streamline employee onboarding and management</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Attendance Tracking</h3>
                  <p className="text-teal-200 text-sm">Monitor attendance and productivity seamlessly</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Secure Platform</h3>
                  <p className="text-teal-200 text-sm">Enterprise-grade security for your data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 lg:max-w-1/2 flex items-center justify-center p-4">
          <div className={`w-full max-w-md ${pageEntered ? "signup-page-enter" : ""}`}>
            {/* Mobile Header */}
            <div className="lg:hidden mb-8 flex items-center gap-3">
              <button
                onClick={handleBackClick}
                className="p-2 -ml-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                disabled={isBackClicked}
              >
                <ChevronLeft className="w-5 h-5 text-slate-700" />
              </button>
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="HRMS"
                  className="w-10 h-10 rounded-xl bg-white shadow-md p-2 border border-teal-100"
                  onError={(e) => {
                    e.currentTarget.src = "/favicon.png";
                  }}
                />
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Create your account
                  </h1>
                  <p className="text-sm text-slate-600">
                    Join HRMS and transform your workforce management.
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:block mb-8">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleBackClick}
                  className="p-2 hover:bg-white hover:bg-opacity-50 rounded-lg transition-colors"
                  disabled={isBackClicked}
                >
                  <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>
                <h1 className="text-2xl font-bold text-slate-900">
                  Create your account
                </h1>
              </div>
              <p className="text-slate-600">
                Join HRMS and transform your workforce management.
              </p>
            </div>

          {/* Registration Card */}
            <Card className="border-0 shadow-lg signup-card">
              <CardContent className="pt-6">
                {error && (
                  <Alert variant="destructive" className="mb-6" aria-live="polite">
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-6 bg-green-50 border-green-200" aria-live="polite">
                    <AlertCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* First Row: Name and Company Name */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.3s" }}>
                      <Label htmlFor="name" className="text-slate-900 font-medium">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="input-icon w-4 h-4 text-slate-400" />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="bg-slate-50 border-slate-200 input-with-icon"
                          autoComplete="name"
                        />
                      </div>
                    </div>

                    {/* Company Name */}
                    <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.35s" }}>
                      <Label htmlFor="companyName" className="text-slate-900 font-medium">
                        Company Name
                      </Label>
                      <div className="relative">
                        <Building className="input-icon w-4 h-4 text-slate-400" />
                        <Input
                          id="companyName"
                          name="companyName"
                          type="text"
                          placeholder="Company"
                          value={formData.companyName}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="bg-slate-50 border-slate-200 input-with-icon"
                          autoComplete="organization"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Second Row: Email and Role */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Email */}
                    <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.4s" }}>
                      <Label htmlFor="email" className="text-slate-900 font-medium">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="input-icon w-4 h-4 text-slate-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="you@company.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="bg-slate-50 border-slate-200 input-with-icon"
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    {/* Role Selection */}
                    <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.5s" }}>
                      <Label htmlFor="role" className="text-slate-900 font-medium">
                        Phone Number
                      </Label>
                       <div className="relative">
                        <Phone className="input-icon w-4 h-4 text-slate-400" />
                        <Input
                          id="phone"
                          name="phone"
                          type="phone"
                          placeholder="+91 1234567890"
                          value={formData.phone}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="bg-slate-50 border-slate-200 input-with-icon"
                          autoComplete="phone"
                        />
                      </div>
                    </div>
                  </div>

               

                  {/* Password Fields Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Password */}
                    <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.6s" }}>
                      <Label htmlFor="password" className="text-slate-900 font-medium">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="input-icon w-4 h-4 text-slate-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.password}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="bg-slate-50 border-slate-200 input-with-icon pr-10"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.7s" }}>
                      <Label htmlFor="confirmPassword" className="text-slate-900 font-medium">
                        Confirm Password
                      </Label>
                      <div className="relative">
                        <Lock className="input-icon w-4 h-4 text-slate-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          disabled={isLoading}
                          className="bg-slate-50 border-slate-200 input-with-icon pr-10"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-white/60 transition-colors"
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Requirements - Full Width */}
                  {formData.password && (
                    <div className="space-y-2 form-field-enter" style={{ animationDelay: "0.65s" }}>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Password Strength</span>
                          <span className="text-xs font-medium text-slate-700">
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="password-strength-bar" aria-hidden="true">
                          <div
                            className="password-strength-fill"
                            style={{
                              width: `${passwordStrength.percent}%`,
                              backgroundColor: passwordStrength.color,
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div className="requirement-item">
                            {passwordRequirements.length ? (
                              <Check className="w-3 h-3 requirement-met" />
                            ) : (
                              <X className="w-3 h-3 requirement-not-met" />
                            )}
                            <span className={passwordRequirements.length ? "requirement-met" : "requirement-not-met"}>
                              8+ characters
                            </span>
                          </div>
                          <div className="requirement-item">
                            {passwordRequirements.uppercase && passwordRequirements.lowercase ? (
                              <Check className="w-3 h-3 requirement-met" />
                            ) : (
                              <X className="w-3 h-3 requirement-not-met" />
                            )}
                            <span className={passwordRequirements.uppercase && passwordRequirements.lowercase ? "requirement-met" : "requirement-not-met"}>
                              Upper & lowercase
                            </span>
                          </div>
                          <div className="requirement-item">
                            {passwordRequirements.number ? (
                              <Check className="w-3 h-3 requirement-met" />
                            ) : (
                              <X className="w-3 h-3 requirement-not-met" />
                            )}
                            <span className={passwordRequirements.number ? "requirement-met" : "requirement-not-met"}>
                              At least one number
                            </span>
                          </div>
                          <div className="requirement-item">
                            {passwordRequirements.special ? (
                              <Check className="w-3 h-3 requirement-met" />
                            ) : (
                              <X className="w-3 h-3 requirement-not-met" />
                            )}
                            <span className={passwordRequirements.special ? "requirement-met" : "requirement-not-met"}>
                              Special character
                            </span>
                          </div>
                        </div>
                        {formData.confirmPassword && (
                          <div className="requirement-item">
                            {formData.password === formData.confirmPassword ? (
                              <>
                                <Check className="w-3 h-3 requirement-met" />
                                <span className="requirement-met">Passwords match</span>
                              </>
                            ) : (
                              <>
                                <X className="w-3 h-3 requirement-not-met" />
                                <span className="requirement-not-met">Passwords do not match</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                      <a href="/terms-conditions" className="font-medium text-teal-600 hover:underline">
                        Terms and Conditions
                      </a>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className={`w-full mt-6 bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-semibold py-3 text-base form-field-enter transition-all duration-200 shadow-lg hover:shadow-xl ${isLoading ? 'loading-pulse' : ''}`}
                    style={{ animationDelay: "0.9s" }}
                    disabled={isSubmitDisabled}
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
                        className="font-semibold text-teal-600 hover:text-teal-700 hover:underline transition-colors"
                      >
                        Sign In
                      </button>
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8 space-y-2">
              <p className="text-xs text-slate-600">
                © {new Date().getFullYear()} Procease HRMS System. All rights reserved.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                <a href="/privacy-policy" className="hover:text-teal-600 transition-colors">Privacy Policy</a>
                <span>•</span>
                <a href="/terms-conditions" className="hover:text-teal-600 transition-colors">Terms and Conditions
                </a>
               
                <span>•</span>
                <a href="/contact" className="hover:text-teal-600 transition-colors">Support</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
