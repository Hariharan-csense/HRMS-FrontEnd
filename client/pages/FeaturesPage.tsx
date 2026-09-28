import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Users,
  Calendar,
  DollarSign,
  Shield,
  BarChart,
  Clock,
  MapPin,
  FileText,
  Settings,
  Award,
  Target,
  Zap,
  Activity,
  TrendingUp,
} from "lucide-react";
import { title } from "process";
import Footer from "@/components/Footer";
import logo from "../assets/logo.png";
import { isCordovaIOS } from "@/lib/platform";

const FeaturesPage = () => {
  const navigate = useNavigate();
  const hideRegistration = isCordovaIOS();

  const features = [
    {
      icon: Users,
      title: "Employee Management",
      description:
        "Comprehensive employee database with detailed profiles, organizational charts, and role management.",
      benefits: [
        "Digital employee records",
        "Organizational hierarchy",
        "Role-based access",
        "Document management",
      ],
    },
    {
      icon: Calendar,
      title: "Attendance Tracking",
      description:
        "Advanced attendance system with facial recognition, geo-tracking, and real-time monitoring.",
      benefits: [
        "Facial recognition",
        "GPS tracking",
        "Live attendance",
        "Automated reports",
      ],
    },
    {
      icon: DollarSign,
      title: "Payroll Management",
      description:
        "Automated payroll processing with tax calculations, deductions, and compliance management.",
      benefits: [
        "Automated calculations",
        "Tax compliance",
        "Payslip generation",
        "Bank integration",
      ],
    },
    {
      icon: FileText,
      title: "Leave Management",
      description:
        "Complete leave management system with approval workflows and balance tracking.",
      benefits: [
        "Leave requests",
        "Approval workflows",
        "Balance tracking",
        "Policy enforcement",
      ],
    },
    {
      icon: BarChart,
      title: "Analytics & Reports",
      description:
        "Comprehensive analytics dashboard with customizable reports and data visualization.",
      benefits: [
        "Real-time analytics",
        "Custom reports",
        "Data visualization",
        "Export capabilities",
      ],
    },
    {
      icon: Shield,
      title: "Security & Compliance",
      description:
        "Enterprise-grade security with role-based access and regulatory compliance.",
      benefits: [
        "Data encryption",
        "Access control",
        "Audit trails",
        "GDPR compliance",
      ],
    },
    {
      icon: MapPin,
      title: "Geo-Fencing",
      description:
        "Location-based attendance with customizable geo-fence boundaries and monitoring.",
      benefits: [
        "Virtual boundaries",
        "Location tracking",
        "Attendance validation",
        "Mobile support",
      ],
    },
    {
      icon: Clock,
      title: "Shift Management",
      description:
        "Flexible shift scheduling with automated assignments and overtime calculations.",
      benefits: [
        "Shift scheduling",
        "Overtime tracking",
        "Resource optimization",
        "Conflict resolution",
      ],
    },
    {
      icon: Target,
      title: "Performance Management",
      description:
        "Employee performance tracking with goal setting, reviews, and development plans.",
      benefits: [
        "Goal setting",
        "Performance reviews",
        "360-degree feedback",
        "Development plans",
      ],
    },
    {
      icon: Award,
      title: "HR Recruitment",
      description:
        "End-to-end recruitment workflow from job posting to onboarding.",
      benefits: [
        "Job postings",
        "Applicant tracking",
        "Interview scheduling",
        "Offer management",
      ],
    },
    {
      icon: Activity,
      title: "Pulse",
      description: "Employee Happiness & Engagement Tracking..",
      benefits: [
        "Periodic employee pulse surveys",
        "Anonymous feedback collection",
        "Engagement and morale tracking over time",
        "Early identification of people issues",
      ],
    },
    {
      icon: TrendingUp,
      title: "KPI",
      description: "Performance Metrics & Goal Alignment..",
      benefits: [
        "Definition of role-based KPIs",
        "Goal tracking at individual and team levels",
        "Performance visibility for managers",
        "Consistent evaluation frameworks",
        "Alignment between effort and outcomes",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/">
            <img
              src={logo}
              alt="HRMS Logo"
              className="h-14 w-14 object-contain"
            />
          </a>
          <nav className="hidden items-center gap-9 text-base font-semibold text-slate-700 md:flex">
            <a href="/">Home</a>
            <a href="/features" className="font-bold text-[#17c491]">
              Features
            </a>
            <a href="/pricing">Pricing</a>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
          </nav>
          <Button
            onClick={() => navigate("/login")}
            className="rounded-full bg-[#17c491] px-7 py-2.5 text-sm font-semibold hover:bg-[#139f78]"
          >
            Sign In
          </Button>
        </div>
      </header>
      <main>
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }} className="px-5 pb-12 pt-14 text-center sm:pt-20">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#17c491]">
            Everything in one system
          </p>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.6 }} className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Tools that keep your people operations moving
          </motion.h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500">
            Powerful HR capabilities designed for growing teams, without the
            clutter.
          </p>
        </motion.section>
        <section className="border-y border-emerald-100 bg-white px-5 py-12">
          <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 26, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ delay: (index % 3) * 0.07, duration: 0.5 }}
                  whileHover={{ y: -8, scale: 1.015 }}
                >
                <Card className="h-full rounded-2xl border-emerald-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-xl">
                  <CardContent className="p-0">
                    <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-[#17c491]/10 text-[#17c491]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="text-base font-bold text-slate-900">
                      {feature.title}
                    </h2>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {feature.description}
                    </p>
                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                      {feature.benefits.map((benefit) => (
                        <div
                          key={benefit}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-[#17c491]" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                </motion.div>
              );
            })}
          </div>
        </section>
        <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white px-5 py-14 text-center text-slate-900">
          <motion.h2 animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} className="text-2xl font-bold">See what your team can do</motion.h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-600">
            Bring every important HR workflow into one dependable place.
          </p>
          <Button
            onClick={() => navigate(hideRegistration ? "/login" : "/signup")}
            className="mt-7 rounded-full bg-[#17c491] px-7 text-sm text-white hover:bg-[#139f78]"
          >
            Get started
          </Button>
        </motion.section>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
              <img src={logo} alt="HRMS Logo" className="h-20 w-20 mr-2" />
              {/* <h1 className="text-2xl font-bold text-gray-900">HRMS</h1> */}
            </div>
            <nav className="hidden md:flex space-x-8">
              <a
                href="/"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Home
              </a>
              <a
                href="/features"
                className="text-green-600 font-medium hover:text-green-700 transition-colors"
              >
                Features
              </a>
              <a
                href="/pricing"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Pricing
              </a>
              <a
                href="/about"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                About
              </a>
              <a
                href="/contact"
                className="text-gray-700 hover:text-gray-900 transition-colors"
              >
                Contact
              </a>
            </nav>
            <Button variant="outline" onClick={() => navigate("/login")}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for Modern HR
          </h1>
          <p className="text-xl text-green-100 mb-8">
            Everything you need to manage your workforce efficiently and
            effectively
          </p>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/login")}
          >
            {hideRegistration ? "Sign In" : "Start Free Trial"}
            <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
          </Button>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="p-6 hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <feature.icon className="h-12 w-12 text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li
                        key={benefitIndex}
                        className="flex items-center text-sm text-gray-700"
                      >
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      {/* <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Seamless Integrations
            </h2>
            <p className="text-xl text-gray-600">
              Connect with your favorite tools and streamline your workflow
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              "Slack", "Microsoft Teams", "Google Workspace", 
              "QuickBooks", "Salesforce", "LinkedIn", 
              "Zoom", "Office 365"
            ].map((integration, index) => (
              <div key={index} className="text-center p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-3"></div>
                <p className="font-medium">{integration}</p>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your HR Operations?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Experience the power of comprehensive HR management with our
            feature-rich platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate("/login")}
            >
              Get Started Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="
                hover:text-white-600"
              onClick={() => navigate("/contact")}
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FeaturesPage;
