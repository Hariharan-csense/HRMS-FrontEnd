import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Users, Calendar, DollarSign, Shield, BarChart, Clock, UserCheck, AlertCircle } from "lucide-react";
import ContactPopup from "@/components/ContactPopup";
import Footer from "@/components/Footer";
import image from "../assets/image.png";
import logo from "../assets/logo.png";

const LandingPage = () => {
  const navigate = useNavigate();
  const [showContactPopup, setShowContactPopup] = useState(false);

  useEffect(() => {
    // Show popup after 2 seconds of page load
    const timer = setTimeout(() => {
      setShowContactPopup(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
              <img src={logo} alt="HRMS Logo" className="h-20 w-20 mr-2" />
              {/* <h1 className="text-2xl font-bold text-gray-900">HRMS</h1> */}
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-green-600 font-medium hover:text-green-700 transition-colors">Home</a>
              <a href="/features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a>
              <a href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="/about" className="text-gray-700 hover:text-gray-900 transition-colors">About</a>
              <a href="/contact" className="text-gray-700 hover:text-gray-900 transition-colors">Contact</a>
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
              Comprehensive HR management solution designed to streamline your workforce operations, 
              from attendance tracking to payroll processing.
            </p>
          </div>
          
          {/* Dashboard Image */}
          <div className="relative w-full max-w-6xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
              <div className="relative w-full" style={{ paddingBottom: '50%' }}>
                <img 
                  src={image} 
                  alt="HRMS Dashboard Preview" 
                  className="absolute inset-0 w-full h-full object-contain bg-gray-50"
                  onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='600' viewBox='0 0 1200 600'%3E%3C!-- Background --%3E%3Crect fill='%23f1f5f9' width='1200' height='600'/%3E%3C!-- Header --%3E%3Crect fill='%2310b981' x='0' y='0' width='1200' height='80'/%3E%3Ctext x='50' y='50' fill='white' font-family='Arial, sans-serif' font-size='28' font-weight='bold'%3EAdmin Dashboard%3C/text%3E%3C!-- Welcome Message --%3E%3Ctext x='50' y='110' fill='%23374151' font-family='Arial, sans-serif' font-size='16'%3EWelcome back, Admin!%3C/text%3E%3C!-- Sidebar --%3E%3Crect fill='white' x='50' y='140' width='250' height='400' rx='8' stroke='%23e2e8f0' stroke-width='2'/%3E%3Crect fill='%23dcfce7' x='70' y='160' width='210' height='40' rx='6'/%3E%3Ctext x='80' y='185' fill='%2316a34a' font-family='Arial, sans-serif' font-size='14' font-weight='600'%3EDashboard%3C/text%3E%3C!-- Menu Items --%3E%3Crect fill='white' x='70' y='210' width='210' height='30' rx='4'/%3E%3Ctext x='80' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='13'%3EOrganization Setup%3C/text%3E%3Crect fill='white' x='70' y='250' width='210' height='30' rx='4'/%3E%3Ctext x='80' y='270' fill='%236b7280' font-family='Arial, sans-serif' font-size='13'%3EEmployee Management%3C/text%3E%3Crect fill='white' x='70' y='290' width='210' height='30' rx='4'/%3E%3Ctext x='80' y='310' fill='%236b7280' font-family='Arial, sans-serif' font-size='13'%3EHR Management%3C/text%3E%3Crect fill='white' x='70' y='330' width='210' height='30' rx='4'/%3E%3Ctext x='80' y='350' fill='%236b7280' font-family='Arial, sans-serif' font-size='13'%3EClient Attendance%3C/text%3E%3C!-- Key Metrics Section --%3E%3Crect fill='white' x='350' y='140' width='800' height='180' rx='8' stroke='%23e2e8f0' stroke-width='2'/%3E%3Ctext x='370' y='130' fill='%231f2937' font-family='Arial, sans-serif' font-size='18' font-weight='bold'%3EKey Metrics%3C/text%3E%3C!-- Metric Cards --%3E%3Crect fill='%23dbeafe' x='370' y='160' width='140' height='100' rx='6'/%3E%3Ctext x='380' y='185' fill='%231e40af' font-family='Arial, sans-serif' font-size='12' font-weight='600'%3ETotal Employees%3C/text%3E%3Ctext x='380' y='210' fill='%231e40af' font-family='Arial, sans-serif' font-size='24' font-weight='bold'%3E3%3C/text%3E%3Ctext x='380' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='11'%3E3 active%3C/text%3E%3Crect fill='%23dcfce7' x='530' y='160' width='140' height='100' rx='6'/%3E%3Ctext x='540' y='185' fill='%2316a34a' font-family='Arial, sans-serif' font-size='12' font-weight='600'%3EPresent Today%3C/text%3E%3Ctext x='540' y='210' fill='%2316a34a' font-family='Arial, sans-serif' font-size='24' font-weight='bold'%3E0%3C/text%3E%3Ctext x='540' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='11'%3E0.0%25 attendance%3C/text%3E%3Crect fill='%23fef3c7' x='690' y='160' width='140' height='100' rx='6'/%3E%3Ctext x='700' y='185' fill='%23a16207' font-family='Arial, sans-serif' font-size='12' font-weight='600'%3EOn Leave%3C/text%3E%3Ctext x='700' y='210' fill='%23a16207' font-family='Arial, sans-serif' font-size='24' font-weight='bold'%3E0%3C/text%3E%3Ctext x='700' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='11'%3E0.0%25 of workforce%3C/text%3E%3Crect fill='%23e9d5ff' x='850' y='160' width='140' height='100' rx='6'/%3E%3Ctext x='860' y='185' fill='%236b21a8' font-family='Arial, sans-serif' font-size='12' font-weight='600'%3EPending Approvals%3C/text%3E%3Ctext x='860' y='210' fill='%236b21a8' font-family='Arial, sans-serif' font-size='24' font-weight='bold'%3E0%3C/text%3E%3Ctext x='860' y='230' fill='%236b7280' font-family='Arial, sans-serif' font-size='11'%3Eall clear%3C/text%3E%3C!-- Subscription Status --%3E%3Crect fill='white' x='350' y='340' width='380' height='200' rx='8' stroke='%23e2e8f0' stroke-width='2'/%3E%3Ctext x='370' y='330' fill='%231f2937' font-family='Arial, sans-serif' font-size='18' font-weight='bold'%3ESubscription Status%3C/text%3E%3Crect fill='%23f0fdf4' x='370' y='360' width='340' height='60' rx='6'/%3E%3Ctext x='380' y='385' fill='%2316a34a' font-family='Arial, sans-serif' font-size='14' font-weight='600'%3ECurrent Plan: platinum%3C/text%3E%3Ctext x='380' y='405' fill='%236b7280' font-family='Arial, sans-serif' font-size='12'%3EDuration: 26 days remaining%3C/text%3E%3Ctext x='380' y='425' fill='%236b7280' font-family='Arial, sans-serif' font-size='12'%3EUsers: 5 Users%3C/text%3E%3Ctext x='380' y='445' fill='%236b7280' font-family='Arial, sans-serif' font-size='12'%3ENext Billing: 06/03/2026%3C/text%3E%3C!-- Success Notification --%3E%3Crect fill='%2310b981' x='370' y='480' width='340' height='40' rx='6'/%3E%3Ctext x='380' y='505' fill='white' font-family='Arial, sans-serif' font-size='12'%3E✓ Login successful! Redirecting to dashboard...%3C/text%3E%3C!-- Empty Card --%3E%3Crect fill='white' x='750' y='340' width='400' height='200' rx='8' stroke='%23e2e8f0' stroke-width='2'/%3E%3Ctext x='770' y='330' fill='%231f2937' font-family='Arial, sans-serif' font-size='18' font-weight='bold'%3EQuick Actions%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
            </div>
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg shadow-lg"
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
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Real-Time Dashboard Insights</h2>
            <p className="text-gray-600">Monitor your entire workforce at a glance</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">Active</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">3</h3>
                <p className="text-gray-600 text-sm">Total Employees</p>
                <p className="text-xs text-gray-500 mt-2">All active</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">100.0%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">3</h3>
                <p className="text-gray-600 text-sm">Present Today</p>
                <p className="text-xs text-gray-500 mt-2">100.0% attendance</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-sm text-gray-600 font-medium">66.7%</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">2</h3>
                <p className="text-gray-600 text-sm">On Leave</p>
                <p className="text-xs text-gray-500 mt-2">66.7% of workforce</p>
              </CardContent>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm text-green-600 font-medium">All Clear</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">1</h3>
                <p className="text-gray-600 text-sm">Pending Approvals</p>
                <p className="text-xs text-gray-500 mt-2">No pending items</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Real-Time Location Tracking Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Real-Time Location Tracking</h2>
            <p className="text-lg text-gray-700 mb-6">
              Monitor your team's presence and activities with live location tracking, ensuring accountability and optimizing field operations. 
              View check-ins, check-outs, and office locations on an interactive map.
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-700">Checked In Employees</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                <span className="text-gray-700">Checked Out Employees</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span className="text-gray-700">Office Locations</span>
              </div>
            </div>
            {/* <Button 
              size="lg" 
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg shadow-lg"
              onClick={handleGetStarted}
            >
              Explore Live Tracking
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button> */}
          </div>
          <div className="relative w-full rounded-xl shadow-2xl overflow-hidden border border-gray-200">
            <img 
              src="/real-time-map-preview.png" 
              alt="Real-Time Location Tracking Map" 
              className="w-full h-auto object-cover"
              onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.target as HTMLImageElement;
                target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect fill='%23e0f2f7' width='800' height='500'/%3E%3C!-- World Map Background --%3E%3Cpath d='M100 150 Q200 100 300 150 T500 150 Q600 100 700 150' stroke='%2310b981' stroke-width='2' fill='none'/%3E%3Cpath d='M150 250 Q250 200 350 250 T550 250 Q650 200 750 250' stroke='%2310b981' stroke-width='2' fill='none'/%3E%3Cpath d='M100 350 Q200 300 300 350 T500 350 Q600 300 700 350' stroke='%2310b981' stroke-width='2' fill='none'/%3E%3C!-- Location Markers --%3E%3Ccircle cx='250' cy='200' r='8' fill='%2310b981'/%3E%3Ccircle cx='250' cy='200' r='15' fill='%2310b981' opacity='0.3'/%3E%3Ctext x='250' y='180' font-family='Arial' font-size='12' fill='%23065f46' text-anchor='middle'%3EChecked In%3C/text%3E%3Ccircle cx='550' cy='250' r='8' fill='%23ef4444'/%3E%3Ccircle cx='550' cy='250' r='15' fill='%23ef4444' opacity='0.3'/%3E%3Ctext x='550' y='230' font-family='Arial' font-size='12' fill='%23991b1b' text-anchor='middle'%3EChecked Out%3C/text%3E%3Ccircle cx='400' cy='300' r='10' fill='%233b82f6'/%3E%3Crect x='390' y='290' width='20' height='20' fill='%233b82f6' opacity='0.3'/%3E%3Ctext x='400' y='280' font-family='Arial' font-size='12' fill='%231e3a8a' text-anchor='middle'%3EOffice%3C/text%3E%3C!-- Title --%3E%3Ctext x='400' y='50' font-family='Arial' font-size='24' font-weight='bold' fill='%23065f46' text-anchor='middle'%3EReal-Time Location Map%3C/text%3E%3Ctext x='400' y='75' font-family='Arial' font-size='14' fill='%23065f46' text-anchor='middle'%3ELive Employee Tracking%3C/text%3E%3C/svg%3E";
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Manage Your Team
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <CardContent className="pt-6">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Employee Management</h3>
                <p className="text-gray-600">Comprehensive employee profiles and organizational structure management</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="pt-6">
                <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Attendance Tracking</h3>
                <p className="text-gray-600">Real-time attendance monitoring with facial recognition and geo-tracking</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="pt-6">
                <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Payroll Management</h3>
                <p className="text-gray-600">Automated payroll processing with accurate calculations and compliance</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="pt-6">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Leave Management</h3>
                <p className="text-gray-600">Streamlined leave requests, approvals, and balance tracking for all employee types</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="pt-6">
                <BarChart className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Performance Analytics</h3>
                <p className="text-gray-600">Data-driven insights and reports to optimize workforce productivity and engagement</p>
              </CardContent>
            </Card>
            <Card className="p-6 text-center">
              <CardContent className="pt-6">
                <Clock className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Time & Scheduling</h3>
                <p className="text-gray-600">Flexible shift scheduling and time tracking for remote and in-office teams</p>
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
              <div className="text-3xl font-bold text-green-600 mb-2">500+</div>
              <div className="text-gray-600">Companies Trust Us</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">50K+</div>
              <div className="text-gray-600">Employees Managed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime Guaranteed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600 mb-2">24/7</div>
              <div className="text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Streamline Your HR Operations?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of companies that have transformed their HR management with our platform.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={handleGetStarted}
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
      
      {/* Contact Popup */}
      <ContactPopup 
        isOpen={showContactPopup} 
        onClose={() => setShowContactPopup(false)} 
      />
    </div>
  );
};

export default LandingPage;
