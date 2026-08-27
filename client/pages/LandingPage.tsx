import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Users,
  Calendar,
  DollarSign,
  Shield,
  BarChart,
  Clock,
  UserCheck,
  AlertCircle,
  Camera,
  Receipt,
  Scan,
  Zap,
} from "lucide-react";
import Footer from "@/components/Footer";
import image from "../assets/image.png";
import logo from "../assets/logo.png";
import liveDelivery from "../assets/7c769c85-2549-41b2-b60a-db5fbda6d108.png";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes bar-grow {
          from { height: 0; }
          to { height: var(--target-height); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.8s ease-out forwards;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.8s ease-out forwards;
        }
        .animate-bar-grow {
          animation: bar-grow 1s ease-out forwards;
        }
      `}</style>
      <div className="min-h-screen bg-gradient-to-br from-[#17c491]/10 to-[#17c491]/20">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center">
                <img src={logo} alt="HRMS Logo" className="h-20 w-20 mr-2" />
                {/* <h1 className="text-2xl font-bold text-gray-900">HRMS</h1> */}
              </div>
              <nav className="hidden md:flex space-x-8">
                <Link
                  to="/"
                  className="text-[#17c491] font-medium hover:text-[#17c491] transition-colors"
                >
                  Home
                </Link>
                <Link
                  to="/features"
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Contact
                </Link>
              </nav>
              <Button variant="outline" onClick={handleGetStarted}>
                Sign In
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section with Dashboard Image */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Transform Your HR Management
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                Comprehensive HR management solution designed to streamline your
                workforce operations, from attendance tracking to payroll
                processing.
              </p>
            </div>

            {/* Dashboard Image */}
            <div className="relative w-full max-w-6xl mx-auto mb-12">
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                <div
                  className="relative w-full"
                  style={{ paddingBottom: "50%" }}
                >
                  <img
                    src={image}
                    alt="HRMS Dashboard Preview"
                    className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                    onError={(
                      e: React.SyntheticEvent<HTMLImageElement, Event>,
                    ) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3C!-- Background --%3E%3Crect fill='%23f1f5f9' width='1200' height='600'/%3E%3C!-- Header --%3E%3Crect fill='%2310b981' x='0' y='0' width='1200' height='80'/%3E%3Ctext x='50' y='50' fill='white' font-family='Arial, sans-serif' font-size='28' font-weight='bold'%3EAdmin Dashboard%3C/text%3E%3C!-- Welcome Message --%3E%3Ctext x='50' y='110' fill='%23374151' font-family='Arial, sans-serif' font-size='16'%3EWelcome back, Admin!%3C/text%3E%3C!-- Sidebar --%3E%3Crect fill='white' x='50' y='140' width='250' height='400' rx='8' stroke='%23e2e8f0' stroke-width='2'/%3E%3Crect fill='%23dcfce7' x='70' y='160' width='210' height='40' rx='6'/%3E%3Ctext x='80' y='185' fill='%2316a34a' font-family='Arial, sans-serif' font-size='14' font-weight='600'%3EDashboard%3C/text%3E%3C!-- Menu Items --%3E%3Crect fill='white' x='70' y='210' width='210' height='30' rx='4'/%3E%3Ctext x='80' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='13'%3EOrganization Setup%3C/text%3E%3Crect fill='white' x='70' y='250' width='210' height='30' rx='4'/%3E%3Ctext x='80' y='270' fill='%236b7280' font-family='Arial, sans-serif' font-size='13'%3EEmployee Management%3C/text%3E%3Crect fill='white' x='70' y='290' width='210' height='30' rx='4'/%3E%3Ctext x='80' y='310' fill='%236b7280' font-family='Arial, sans-serif' font-size='13'%3EHR Management%3C/text%3E%3Crect fill='white' x='70' y='330' width='210' height='30' rx='4'/%3E%3Ctext x='80' y='350' fill='%236b7280' font-family='Arial, sans-serif' font-size='13'%3EClient Attendance%3C/text%3E%3C!-- Key Metrics Section --%3E%3Crect fill='white' x='350' y='140' width='800' height='180' rx='8' stroke='%23e2e8f0' stroke-width='2'/%3E%3Ctext x='370' y='130' fill='%231f2937' font-family='Arial, sans-serif' font-size='18' font-weight='bold'%3EKey Metrics%3C/text%3E%3C!-- Metric Cards --%3E%3Crect fill='%23dbeafe' x='370' y='160' width='140' height='100' rx='6'/%3E%3Ctext x='380' y='185' fill='%231e40af' font-family='Arial, sans-serif' font-size='12' font-weight='600'%3ETotal Employees%3C/text%3E%3Ctext x='380' y='210' fill='%231e40af' font-family='Arial, sans-serif' font-size='24' font-weight='bold'%3E3%3C/text%3E%3Ctext x='380' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='11'%3E3 active%3C/text%3E%3Crect fill='%23dcfce7' x='530' y='160' width='140' height='100' rx='6'/%3E%3Ctext x='540' y='185' fill='%2316a34a' font-family='Arial, sans-serif' font-size='12' font-weight='600'%3EPresent Today%3C/text%3E%3Ctext x='540' y='210' fill='%2316a34a' font-family='Arial, sans-serif' font-size='24' font-weight='bold'%3E0%3C/text%3E%3Ctext x='540' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='11'%3E0.0%25 attendance%3C/text%3E%3Crect fill='%23fef3c7' x='690' y='160' width='140' height='100' rx='6'/%3E%3Ctext x='700' y='185' fill='%23a16207' font-family='Arial, sans-serif' font-size='12' font-weight='600'%3EOn Leave%3C/text%3E%3Ctext x='700' y='210' fill='%23a16207' font-family='Arial, sans-serif' font-size='24' font-weight='bold'%3E0%3C/text%3E%3Ctext x='700' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='11'%3E0.0%25 of workforce%3C/text%3E%3Crect fill='%23e9d5ff' x='850' y='160' width='140' height='100' rx='6'/%3E%3Ctext x='860' y='185' fill='%236b21a8' font-family='Arial, sans-serif' font-size='12' font-weight='600'%3EPending Approvals%3C/text%3E%3Ctext x='860' y='210' fill='%236b21a8' font-family='Arial, sans-serif' font-size='24' font-weight='bold'%3E0%3C/text%3E%3Ctext x='860' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='11'%3Eall clear%3C/text%3E%3C!-- Subscription Status --%3E%3Crect fill='white' x='350' y='340' width='380' height='200' rx='8' stroke='%23e2e8f0' stroke-width='2'/%3E%3Ctext x='370' y='330' fill='%231f2937' font-family='Arial, sans-serif' font-size='18' font-weight='bold'%3ESubscription Status%3C/text%3E%3Crect fill='%23f0fdf4' x='370' y='360' width='340' height='60' rx='6'/%3E%3Ctext x='380' y='385' fill='%2316a34a' font-family='Arial, sans-serif' font-size='14' font-weight='600'%3ECurrent Plan: platinum%3C/text%3E%3Ctext x='380' y='405' fill='%236b7280' font-family='Arial, sans-serif' font-size='12'%3EDuration: 26 days remaining%3C/text%3E%3Ctext x='380' y='425' fill='%236b7280' font-family='Arial, sans-serif' font-size='12'%3EUsers: 5 Users%3C/text%3E%3Ctext x='380' y='445' fill='%236b7280' font-family='Arial, sans-serif' font-size='12'%3ENext Billing: 06/03/2026%3C/text%3E%3C!-- Success Notification --%3E%3Crect fill='%2310b981' x='370' y='480' width='340' height='40' rx='6'/%3E%3Ctext x='380' y='505' fill='white' font-family='Arial, sans-serif' font-size='12'%3E✓ Login successful! Redirecting to dashboard...%3C/text%3E%3C!-- Empty Card --%3E%3Crect fill='white' x='750' y='340' width='400' height='200' rx='8' stroke='%23e2e8f0' stroke-width='2'/%3E%3Ctext x='770' y='330' fill='%231f2937' font-family='Arial, sans-serif' font-size='18' font-weight='bold'%3EQuick Actions%3C/text%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                <Button
                  size="lg"
                  className="bg-[#17c491] hover:bg-[#13aa7e] text-white px-8 py-3 text-lg shadow-lg"
                  onClick={handleGetStarted}
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Features Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Real-Time Dashboard Insights
              </h2>
              <p className="text-gray-600">
                Monitor your entire workforce at a glance
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card
                className="p-6 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "0ms" }}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-md">
                      <Users className="w-6 h-6 text-[#17c491] group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-sm text-[#17c491] font-medium animate-pulse">
                      Active
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#17c491] transition-colors">
                    3
                  </h3>
                  <p className="text-gray-600 text-sm">Total Employees</p>
                  <p className="text-xs text-gray-500 mt-2">All active</p>
                </CardContent>
              </Card>

              <Card
                className="p-6 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "100ms" }}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-md">
                      <UserCheck className="w-6 h-6 text-[#17c491] group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-sm text-[#17c491] font-medium animate-pulse">
                      100.0%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#17c491] transition-colors">
                    3
                  </h3>
                  <p className="text-gray-600 text-sm">Present Today</p>
                  <p className="text-xs text-gray-500 mt-2">
                    100.0% attendance
                  </p>
                </CardContent>
              </Card>

              <Card
                className="p-6 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "200ms" }}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-md">
                      <Calendar className="w-6 h-6 text-[#17c491] group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-sm text-gray-600 font-medium">
                      66.7%
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#17c491] transition-colors">
                    2
                  </h3>
                  <p className="text-gray-600 text-sm">On Leave</p>
                  <p className="text-xs text-gray-500 mt-2">
                    66.7% of workforce
                  </p>
                </CardContent>
              </Card>

              <Card
                className="p-6 hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "300ms" }}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-md">
                      <AlertCircle className="w-6 h-6 text-[#17c491] group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-sm text-[#17c491] font-medium animate-pulse">
                      All Clear
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-[#17c491] transition-colors">
                    1
                  </h3>
                  <p className="text-gray-600 text-sm">Pending Approvals</p>
                  <p className="text-xs text-gray-500 mt-2">No pending items</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Real-Time Location Tracking Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#17c491]/10 to-[#17c491]/20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Real-Time Location Tracking
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Monitor your team's presence and activities with live location
                tracking, ensuring accountability and optimizing field
                operations. View check-ins, check-outs, and office locations on
                an interactive map.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-[#17c491] rounded-full"></div>
                  <span className="text-gray-700">Checked In Employees</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-[#17c491] rounded-full"></div>
                  <span className="text-gray-700">Checked Out Employees</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-[#17c491]/100 rounded-full"></div>
                  <span className="text-gray-700">Office Locations</span>
                </div>
              </div>
            </div>
            <div className="relative w-full rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <img
                src={liveDelivery}
                alt="Live Location Tracking"
                className="w-full h-auto object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            </div>
          </div>
        </section>

        {/* Expense Management Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="relative w-full rounded-xl shadow-2xl overflow-hidden border border-gray-200 order-2 md:order-1">
              <div className="bg-gradient-to-br from-[#17c491]/10 to-[#17c491]/20 p-8">
                {/* Expense Card Preview */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-[#17c491]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          New Expense
                        </h4>
                        <p className="text-sm text-gray-500">
                          Auto-filled from scan
                        </p>
                      </div>
                    </div>
                    <span className="text-[#17c491] font-bold">₹2,450.00</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Merchant</span>
                      <span className="text-gray-900">Amazon India</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Date</span>
                      <span className="text-gray-900">Apr 20, 2026</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Category</span>
                      <span className="text-gray-900">Office Supplies</span>
                    </div>
                  </div>
                </div>
                {/* Scan Animation */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#17c491] to-[#13aa7e] rounded-xl flex items-center justify-center animate-pulse">
                      <Scan className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">
                        Auto-Scan Active
                      </h4>
                      <p className="text-sm text-gray-500">
                        Point camera at bill receipt
                      </p>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#17c491] h-2 rounded-full"
                          style={{ width: "75%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left order-1 md:order-2">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Smart Expense Management
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Simplify expense reporting with AI-powered bill scanning. Just
                snap a photo of your receipt and watch as the details are
                automatically extracted and filled in seconds.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center">
                    <Camera className="w-5 h-5 text-[#17c491]" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      Auto-Scan Bills
                    </h4>
                    <p className="text-sm text-gray-500">
                      Capture receipts with your camera for instant data
                      extraction
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#17c491]" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      Smart Auto-Fill
                    </h4>
                    <p className="text-sm text-gray-500">
                      Amount, date, merchant & category filled automatically
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {/* <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-[#17c491]" />
                </div> */}
                  {/* <div className="text-left">
                  <h4 className="font-medium text-gray-900">Fraud Detection</h4>
                  <p className="text-sm text-gray-500">AI verification to prevent duplicate or fraudulent claims</p>
                </div> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Payroll Management Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#17c491]/10 to-[#17c491]/20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="relative w-full rounded-xl shadow-2xl overflow-hidden border border-gray-200 order-2 md:order-1 animate-fade-in hover:shadow-3xl transition-all duration-500">
              <div className="bg-gradient-to-br from-[#17c491]/10 to-[#17c491]/20 p-8">
                {/* Payroll Card Preview */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-4 hover:scale-[1.02] transition-transform duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-[#17c491]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          April 2026 Payroll
                        </h4>
                        <p className="text-sm text-gray-500">
                          Auto-calculated & ready
                        </p>
                      </div>
                    </div>
                    <span className="text-[#17c491] font-bold animate-pulse">
                      ₹4,25,000
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Total Employees</span>
                      <span className="text-gray-900 font-medium">24</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Working Days</span>
                      <span className="text-gray-900 font-medium">22 days</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Deductions</span>
                      <span className="text-[#17c491] font-medium">
                        - ₹32,400
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Bonuses</span>
                      <span className="text-[#17c491] font-medium">
                        + ₹15,000
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700 font-semibold">
                          Net Payable
                        </span>
                        <span className="text-[#17c491] font-bold text-lg">
                          ₹4,07,600
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Payslip Preview */}
                <div className="bg-white rounded-xl shadow-lg p-6 hover:scale-[1.02] transition-transform duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      Employee Payslip
                    </h4>
                    <div className="w-8 h-8 bg-[#17c491]/15 rounded-full flex items-center justify-center animate-bounce">
                      <svg
                        className="w-4 h-4 text-[#17c491]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-[#17c491] rounded-full flex items-center justify-center text-white font-bold text-sm">
                      RS
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Ravi Kumar</p>
                      <p className="text-xs text-gray-500">Software Engineer</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-[#17c491]/10 p-2 rounded">
                      <p className="text-gray-500 text-xs">Basic Salary</p>
                      <p className="font-semibold text-gray-900">₹45,000</p>
                    </div>
                    <div className="bg-[#17c491]/10 p-2 rounded">
                      <p className="text-gray-500 text-xs">HRA</p>
                      <p className="font-semibold text-gray-900">₹18,000</p>
                    </div>
                    <div className="bg-[#17c491]/10 p-2 rounded">
                      <p className="text-gray-500 text-xs">PF (Employee)</p>
                      <p className="font-semibold text-gray-900">₹5,400</p>
                    </div>
                    <div className="bg-[#17c491]/10 p-2 rounded">
                      <p className="text-gray-500 text-xs">Net Salary</p>
                      <p className="font-semibold text-[#17c491]">₹57,600</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-center md:text-left order-1 md:order-2 animate-slide-in-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 hover:text-[#17c491] transition-colors duration-300">
                Automated Payroll Management
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Streamline your payroll process with automatic calculations, tax
                compliance, and instant payslip generation. Save hours of manual
                work and ensure 100% accuracy every month.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:scale-110 transition-all duration-300">
                    <DollarSign className="w-5 h-5 text-[#17c491] group-hover:rotate-12 transition-transform duration-300" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      Auto Salary Calculation
                    </h4>
                    <p className="text-sm text-gray-500">
                      Basic, HRA, allowances & deductions calculated
                      automatically
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:scale-110 transition-all duration-300">
                    <svg
                      className="w-5 h-5 text-[#17c491] group-hover:rotate-12 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      Instant Payslips
                    </h4>
                    <p className="text-sm text-gray-500">
                      Generate & email payslips to all employees with one click
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:scale-110 transition-all duration-300">
                    <svg
                      className="w-5 h-5 text-[#17c491] group-hover:rotate-12 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      Tax Compliance
                    </h4>
                    <p className="text-sm text-gray-500">
                      Automatic TDS, PF, ESI calculations as per government
                      rules
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pulse Survey Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#17c491]/10 to-[#17c491]/20">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left animate-slide-in-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-4 hover:text-[#17c491] transition-colors duration-300">
                Employee Pulse Surveys
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                Keep your finger on the pulse of your organization. Collect
                real-time feedback, measure employee sentiment, and take action
                to improve workplace culture and engagement.
              </p>
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:scale-110 transition-all duration-300">
                    <svg
                      className="w-5 h-5 text-[#17c491] group-hover:rotate-12 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      Quick Polls & Surveys
                    </h4>
                    <p className="text-sm text-gray-500">
                      Create and send surveys in minutes with pre-built
                      templates
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:scale-110 transition-all duration-300">
                    <svg
                      className="w-5 h-5 text-[#17c491] group-hover:rotate-12 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      Real-time Analytics
                    </h4>
                    <p className="text-sm text-gray-500">
                      Visual dashboards showing engagement trends and sentiment
                      analysis
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 group cursor-pointer">
                  <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center group-hover:bg-[#17c491]/25 group-hover:scale-110 transition-all duration-300">
                    <svg
                      className="w-5 h-5 text-[#17c491] group-hover:rotate-12 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">
                      Anonymous Feedback
                    </h4>
                    <p className="text-sm text-gray-500">
                      Encourage honest responses with anonymous survey options
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative w-full rounded-xl shadow-2xl overflow-hidden border border-gray-200 order-2 md:order-2 animate-fade-in hover:shadow-3xl transition-all duration-500">
              <div className="bg-gradient-to-br from-[#17c491]/10 to-[#17c491]/20 p-8">
                {/* Survey Card */}
                <div className="bg-white rounded-xl shadow-lg p-6 mb-4 hover:scale-[1.02] transition-transform duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-[#17c491]/15 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-5 h-5 text-[#17c491]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                          />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          Weekly Pulse Check
                        </h4>
                        <p className="text-sm text-gray-500">
                          Active • 18 responses
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-[#17c491]/15 text-[#17c491] px-2 py-1 rounded-full animate-pulse">
                      Live
                    </span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      How satisfied are you with your work-life balance this
                      week?
                    </p>
                    <div className="flex space-x-2">
                      <div className="flex-1 h-8 bg-[#17c491]/10 rounded flex items-center justify-center text-xs text-[#17c491] hover:scale-105 transition-transform cursor-pointer">
                        😟 2
                      </div>
                      <div className="flex-1 h-8 bg-[#17c491]/15 rounded flex items-center justify-center text-xs text-[#17c491] hover:scale-105 transition-transform cursor-pointer">
                        😐 3
                      </div>
                      <div className="flex-1 h-8 bg-[#17c491]/20 rounded flex items-center justify-center text-xs text-[#17c491] hover:scale-105 transition-transform cursor-pointer">
                        🙂 5
                      </div>
                      <div className="flex-1 h-8 bg-[#17c491]/15 rounded flex items-center justify-center text-xs text-[#17c491] font-semibold hover:scale-105 transition-transform cursor-pointer animate-pulse">
                        😊 8
                      </div>
                    </div>
                  </div>
                </div>
                {/* Analytics Preview */}
                <div className="bg-white rounded-xl shadow-lg p-6 hover:scale-[1.02] transition-transform duration-300 hover:shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">
                      Engagement Score
                    </h4>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-[#17c491] rounded-full animate-pulse"></div>
                      <span className="text-xs text-[#17c491] animate-pulse">
                        +12% this month
                      </span>
                    </div>
                  </div>
                  <div className="flex items-end space-x-2 h-24 mb-2">
                    <div
                      className="flex-1 bg-[#17c491]/25 rounded-t animate-bar-grow hover:bg-[#17c491]/40 transition-colors cursor-pointer"
                      style={{ height: "40%", animationDelay: "0ms" }}
                    ></div>
                    <div
                      className="flex-1 bg-[#17c491]/35 rounded-t animate-bar-grow hover:bg-[#17c491]/50 transition-colors cursor-pointer"
                      style={{ height: "55%", animationDelay: "100ms" }}
                    ></div>
                    <div
                      className="flex-1 bg-[#17c491]/45 rounded-t animate-bar-grow hover:bg-[#17c491]/55 transition-colors cursor-pointer"
                      style={{ height: "45%", animationDelay: "200ms" }}
                    ></div>
                    <div
                      className="flex-1 bg-[#17c491]/55 rounded-t animate-bar-grow hover:bg-[#17c491]/70 transition-colors cursor-pointer"
                      style={{ height: "70%", animationDelay: "300ms" }}
                    ></div>
                    <div
                      className="flex-1 bg-[#17c491]/70 rounded-t animate-bar-grow hover:bg-[#17c491]/80 transition-colors cursor-pointer"
                      style={{ height: "85%", animationDelay: "400ms" }}
                    ></div>
                    <div
                      className="flex-1 bg-[#17c491]/55 rounded-t animate-bar-grow hover:bg-[#17c491]/70 transition-colors cursor-pointer"
                      style={{ height: "75%", animationDelay: "500ms" }}
                    ></div>
                    <div
                      className="flex-1 bg-[#17c491]/70 rounded-t animate-bar-grow hover:bg-[#17c491]/80 transition-colors cursor-pointer"
                      style={{ height: "90%", animationDelay: "600ms" }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-center group cursor-pointer">
                      <p className="text-2xl font-bold text-[#17c491] group-hover:scale-110 transition-transform">
                        87%
                      </p>
                      <p className="text-xs text-gray-500">Engagement</p>
                    </div>
                    <div className="text-center border-l pl-4 group cursor-pointer">
                      <p className="text-2xl font-bold text-[#17c491] group-hover:scale-110 transition-transform">
                        4.5
                      </p>
                      <p className="text-xs text-gray-500">Avg Rating</p>
                    </div>
                    <div className="text-center border-l pl-4 group cursor-pointer">
                      <p className="text-2xl font-bold text-[#17c491] group-hover:scale-110 transition-transform">
                        92%
                      </p>
                      <p className="text-xs text-gray-500">Response</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Preview */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-[#17c491]/10 to-[#17c491]/20">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Everything You Need to Manage Your Team
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card
                className="p-6 text-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "0ms" }}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-[#17c491]/15 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                    <Users className="h-8 w-8 text-[#17c491] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-[#17c491] transition-colors">
                    Employee Management
                  </h3>
                  <p className="text-gray-600">
                    Comprehensive employee profiles and organizational structure
                    management
                  </p>
                </CardContent>
              </Card>
              <Card
                className="p-6 text-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "100ms" }}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-[#17c491]/15 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                    <Calendar className="h-8 w-8 text-[#17c491] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-[#17c491] transition-colors">
                    Attendance Tracking
                  </h3>
                  <p className="text-gray-600">
                    Real-time attendance monitoring with facial recognition and
                    geo-tracking
                  </p>
                </CardContent>
              </Card>
              <Card
                className="p-6 text-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "200ms" }}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-[#17c491]/15 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                    <DollarSign className="h-8 w-8 text-[#17c491] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-[#17c491] transition-colors">
                    Payroll Management
                  </h3>
                  <p className="text-gray-600">
                    Automated payroll processing with accurate calculations and
                    compliance
                  </p>
                </CardContent>
              </Card>
              <Card
                className="p-6 text-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "300ms" }}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-[#17c491]/15 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                    <Shield className="h-8 w-8 text-[#17c491] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-[#17c491] transition-colors">
                    Leave Management
                  </h3>
                  <p className="text-gray-600">
                    Streamlined leave requests, approvals, and balance tracking
                    for all employee types
                  </p>
                </CardContent>
              </Card>
              <Card
                className="p-6 text-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "400ms" }}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-[#17c491]/15 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                    <BarChart className="h-8 w-8 text-[#17c491] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-[#17c491] transition-colors">
                    Performance Analytics
                  </h3>
                  <p className="text-gray-600">
                    Data-driven insights and reports to optimize workforce
                    productivity and engagement
                  </p>
                </CardContent>
              </Card>
              <Card
                className="p-6 text-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "500ms" }}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-[#17c491]/15 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                    <Clock className="h-8 w-8 text-[#17c491] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-[#17c491] transition-colors">
                    Time & Scheduling
                  </h3>
                  <p className="text-gray-600">
                    Flexible shift scheduling and time tracking for remote and
                    in-office teams
                  </p>
                </CardContent>
              </Card>
              <Card
                className="p-6 text-center hover:shadow-2xl hover:scale-105 hover:-translate-y-2 transition-all duration-500 border border-gray-100 hover:border-[#17c491]/40 animate-fade-in group cursor-pointer"
                style={{ animationDelay: "600ms" }}
              >
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-[#17c491]/15 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#17c491]/25 group-hover:rotate-6 transition-all duration-300 shadow-sm group-hover:shadow-lg">
                    <Receipt className="h-8 w-8 text-[#17c491] group-hover:scale-110 transition-transform" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 group-hover:text-[#17c491] transition-colors">
                    Expense Management
                  </h3>
                  <p className="text-gray-600">
                    AI-powered bill scanning with auto-fill for effortless
                    expense reporting
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        {/* <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#17c491] mb-2">500+</div>
              <div className="text-gray-600">Companies Trust Us</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#17c491] mb-2">50K+</div>
              <div className="text-gray-600">Employees Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#17c491] mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guaranteed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#17c491] mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section> */}

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#17c491]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Streamline Your HR Operations?
            </h2>
            <p className="text-xl text-white/85 mb-8">
              Join thousands of companies that have transformed their HR
              management with our platform.
            </p>
            <Button size="lg" variant="secondary" onClick={handleGetStarted}>
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
