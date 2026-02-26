import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader, ArrowLeft, Mail, CheckCircle, Lock } from "lucide-react";
import { showToast } from "@/utils/toast";
import ENDPOINTS from "@/lib/endpoint";
import { isValidEmail, normalizeEmail } from "@/lib/validation";
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

  .forgot-password-card {
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .forgot-password-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
  }

  .button-press {
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .button-press:active {
    transform: scale(0.98);
  }

  @keyframes pageEnter {
    from {
      opacity: 0;
      transform: perspective(1200px) rotateX(30deg) translateY(40px);
    }
    to {
      opacity: 1;
      transform: perspective(1200px) rotateX(0deg) translateY(0);
    }
  }

  .page-container {
    animation: pageEnter 0.8s ease-out;
  }

  .otp-input {
    width: 100%;
    height: 50px;
    font-size: 32px;
    letter-spacing: 10px;
    text-align: center;
    font-weight: bold;
  }

  .step-indicator {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
  }

  .step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: rgba(168, 162, 156, 0.3);
    transition: all 0.3s ease;
  }

  .step-dot.active {
    background-color: #14b8a6;
    width: 24px;
    border-radius: 4px;
  }

  .success-icon {
    animation: scaleIn 0.6s ease-out;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .timer {
    color: #ef4444;
    font-weight: bold;
  }
`;

type Step = "email" | "otp" | "password" | "success";

export default function ForgotPassword() {
  const [currentStep, setCurrentStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const navigate = useNavigate();

  // Timer for OTP expiry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      showToast.error("Please enter your email");
      return;
    }
    if (!isValidEmail(email)) {
      showToast.error("Please enter a valid email address");
      return;
    }

    const normalizedEmail = normalizeEmail(email);

    setIsLoading(true);
    try {
      const response = await ENDPOINTS.forgotPassword(normalizedEmail);
      setEmail(normalizedEmail);
      
      if (response.data.success) {
        showToast.success("OTP sent to your email!");
        setCurrentStep("otp");
        setTimer(600); // 10 minutes
      } else {
        showToast.error(response.data.message || "Failed to send OTP");
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp) {
      showToast.error("Please enter the OTP");
      return;
    }

    if (otp.length !== 6) {
      showToast.error("OTP must be 6 digits");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ENDPOINTS.verifyOTP(email, otp);
      
      if (response.data.success) {
        showToast.success("OTP verified!");
        setCurrentStep("password");
      } else {
        showToast.error(response.data.message || "Invalid OTP");
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      showToast.error("Please fill all fields");
      return;
    }

    if (newPassword.length < 6) {
      showToast.error("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await ENDPOINTS.resetPasswordForgot(email, newPassword, confirmPassword);
      
      if (response.data.success) {
        showToast.success("Password reset successfully!");
        setCurrentStep("success");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        showToast.error(response.data.message || "Failed to reset password");
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  const StepIndicator = ({ total, current }: { total: number; current: number }) => (
    <div className="step-indicator">
      {[...Array(total)].map((_, i) => (
        <div
          key={i}
          className={`step-dot ${i < current ? "active" : ""}`}
        ></div>
      ))}
    </div>
  );

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
        <div className="absolute -bottom-8 right-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "2s" }}></div>

        <div className="w-full max-w-md relative z-10 page-container">
          {/* Back Button */}
          <button
            onClick={handleBackToLogin}
            className="flex items-center gap-2 text-teal-600 hover:text-teal-700 mb-6 text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </button>

          {/* Logo */}
          <div className="text-center mb-8 animate-fade-in-down">
            <div className="w-40 h-40 flex items-center justify-center mx-auto mb-2 animate-float cursor-pointer hover:scale-105 transition-transform duration-300">
              <img
                src={logo}
                alt="HRMS Logo"
                className="w-full h-full object-contain p-2"
              />
            </div>
          </div>

          {/* Forgot Password Card */}
          <Card className="border-0 shadow-2xl forgot-password-card animate-fade-in-up">
            <CardHeader>
              <CardTitle>
                {currentStep === "email" && "Forgot Password"}
                {currentStep === "otp" && "Verify OTP"}
                {currentStep === "password" && "Set New Password"}
                {currentStep === "success" && "Success"}
              </CardTitle>
              <CardDescription>
                {currentStep === "email" && "Enter your email to receive an OTP"}
                {currentStep === "otp" && "Enter the 6-digit OTP sent to your email"}
                {currentStep === "password" && "Create your new password"}
                {currentStep === "success" && "Your password has been reset successfully"}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {/* Step Indicator */}
              {currentStep !== "success" && (
                <StepIndicator
                  total={3}
                  current={
                    currentStep === "email"
                      ? 1
                      : currentStep === "otp"
                        ? 2
                        : 3
                  }
                />
              )}

              {/* Email Step */}
              {currentStep === "email" && (
                <form onSubmit={handleSendOTP} className="space-y-4">
                  <div className="space-y-2 animate-slide-in">
                    <Label htmlFor="email" className="text-slate-700 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="input-focus border-slate-200 focus:border-primary focus:ring-primary/10 bg-white"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full button-press bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-white font-medium animate-fade-in-up"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Sending OTP...
                      </>
                    ) : (
                      <>Send OTP</>
                    )}
                  </Button>
                </form>
              )}

              {/* OTP Step */}
              {currentStep === "otp" && (
                <form onSubmit={handleVerifyOTP} className="space-y-4">
                  <div className="space-y-2 animate-slide-in">
                    <Label htmlFor="otp" className="text-slate-700">
                      Enter 6-Digit OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      required
                      disabled={isLoading}
                      className="otp-input input-focus border-slate-200 focus:border-primary focus:ring-primary/10 bg-white"
                    />
                    <p className="text-sm text-slate-600 text-center mt-2">
                      OTP expires in <span className="timer">{formatTime(timer)}</span>
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full button-press bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-white font-medium animate-fade-in-up"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>Verify OTP</>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setCurrentStep("email")}
                    disabled={isLoading}
                    className="w-full h-10 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Change Email
                  </Button>
                </form>
              )}

              {/* Password Step */}
              {currentStep === "password" && (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.1s" }}>
                    <Label htmlFor="newPassword" className="text-slate-700 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      New Password
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="input-focus border-slate-200 focus:border-primary focus:ring-primary/10 bg-white"
                    />
                  </div>

                  <div className="space-y-2 animate-slide-in" style={{ animationDelay: "0.2s" }}>
                    <Label htmlFor="confirmPassword" className="text-slate-700 flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Confirm Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="input-focus border-slate-200 focus:border-primary focus:ring-primary/10 bg-white"
                    />
                  </div>

                  <p className="text-sm text-slate-600">
                    Password must be at least 6 characters long.
                  </p>

                  <Button
                    type="submit"
                    className="w-full button-press bg-gradient-to-r from-teal-500 to-teal-600 hover:shadow-lg hover:from-teal-600 hover:to-teal-700 transition-all duration-300 text-white font-medium animate-fade-in-up"
                    style={{ animationDelay: "0.3s" }}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Resetting Password...
                      </>
                    ) : (
                      <>Reset Password</>
                    )}
                  </Button>
                </form>
              )}

              {/* Success Step */}
              {currentStep === "success" && (
                <div className="text-center space-y-4 py-8">
                  <div className="flex justify-center success-icon">
                    <CheckCircle className="w-16 h-16 text-green-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-700">
                    Password Reset Successfully!
                  </h3>
                  <p className="text-sm text-slate-600">
                    Your password has been changed. Redirecting to login page...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-slate-600 mt-8 animate-fade-in-up">
            © {new Date().getFullYear()} © {new Date().getFullYear()} Procease HRMS System. All rights reserved.
          </p>
        </div>
      </div>
    </>
  );
}
