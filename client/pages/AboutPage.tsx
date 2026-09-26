import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Users,
  Target,
  Award,
  Lightbulb,
  Heart,
  Globe,
  TrendingUp,
  Shield,
  Zap,
  Building,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Footer from "@/components/Footer";
import logo from "../assets/logo.png";

const AboutPage = () => {
  const navigate = useNavigate();

  const philosophyPoints = [
    {
      icon: Shield,
      title: "Strong Organizations",
      description: "Built on clear processes, not heroic individuals",
    },
    {
      icon: Zap,
      title: "HR Enablement",
      description: "Should enable business decisions, not slow them down",
    },
    {
      icon: Target,
      title: "System-Guided Behavior",
      description: "Systems should guide behavior, not just record data",
    },
    {
      icon: Heart,
      title: "Simplicity",
      description: "Simplicity is a strength, not a compromise",
    },
  ];

  const targetAudience = [
    {
      icon: Building,
      title: "Growing SMEs",
      description:
        "Small and mid-sized organizations transitioning from informal HR practices",
    },
    {
      icon: TrendingUp,
      title: "Professionalizing Teams",
      description: "Businesses aiming to professionalize operations",
    },
    {
      icon: Users,
      title: "Scaling Organizations",
      description:
        "Teams preparing for scale, audits, or multi-department coordination",
    },
  ];

  const approachSteps = [
    {
      step: "01",
      title: "Understand",
      description: "How work actually happens in your organization",
    },
    {
      step: "02",
      title: "Define",
      description: "Clear, repeatable processes that work for your context",
    },
    {
      step: "03",
      title: "Translate",
      description: "Those processes into usable systems",
    },
    {
      step: "04",
      title: "Support",
      description: "Adoption until discipline becomes habit",
    },
  ];

  const differentiators = [
    "Built specifically for Indian SME realities",
    "Grounded in real operational and consulting experience",
    "Focused on long-term usability, not short-term features",
    "Designed to grow with the organization",
  ];

  return (
    <div className="min-h-screen bg-[#fffdfd] text-slate-800">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/">
            <img
              src={logo}
              alt="Procease HRMS Logo"
              className="h-14 w-14 object-contain"
            />
          </a>
          <nav className="hidden items-center gap-9 text-base font-semibold text-slate-700 md:flex">
            <a href="/">Home</a>
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/about" className="font-bold text-[#17c491]">
              About
            </a>
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
        <section className="px-5 pb-14 pt-14 sm:pt-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-[#17c491]">
              Process-driven HR management
            </p>
            <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
              About Procease HRMS
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-500">
              A process-driven Human Resource Management platform created to
              help growing Indian SMEs build disciplined, scalable
              organizations.
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="mt-8 rounded-full bg-[#17c491] px-7 text-sm shadow-lg shadow-emerald-200 hover:bg-[#139f78]"
            >
              Get started today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </section>
        <section className="border-y border-emerald-100 bg-[#f1fffb] px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#17c491]">
                  Why we exist
                </p>
                <h2 className="mt-3 text-3xl font-bold text-slate-900">
                  We solve a fundamental problem
                </h2>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-white p-7 shadow-sm">
                <p className="text-xl font-semibold leading-8 text-slate-900">
                  HR depends too much on people and too little on systems.
                </p>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Procease turns clear processes into usable systems so growing
                  teams can operate with confidence and consistency.
                </p>
              </div>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {philosophyPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <Card
                    key={point.title}
                    className="rounded-2xl border-emerald-100 bg-white p-5 shadow-sm"
                  >
                    <CardContent className="p-0">
                      <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#17c491]/10 text-[#17c491]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {point.title}
                      </h3>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {point.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
        <section className="px-5 py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#17c491]">
                Who we help
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Built for organizations ready to grow
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {targetAudience.map((item) => {
                const Icon = item.icon;
                return (
                  <Card
                    key={item.title}
                    className="rounded-2xl border-slate-200 p-6 shadow-sm"
                  >
                    <CardContent className="p-0">
                      <Icon className="h-6 w-6 text-[#17c491]" />
                      <h3 className="mt-5 text-base font-bold text-slate-900">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
        <section className="bg-[#17c491] px-5 py-14 text-white">
          <div className="mx-auto max-w-5xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/80">
              Our approach
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {approachSteps.map((step) => (
                <div key={step.step} className="border-l border-white/40 pl-4">
                  <p className="text-xs font-bold text-white/70">{step.step}</p>
                  <h3 className="mt-2 text-base font-bold">{step.title}</h3>
                  <p className="mt-2 text-xs leading-5 text-white/85">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
              <img
                src={logo}
                alt="Procease HRMS Logo"
                className="h-20 w-20 mr-2"
              />
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
                className="text-gray-700 hover:text-gray-900 transition-colors"
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
                className="text-green-600 font-medium hover:text-green-700 transition-colors"
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
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600"></div>
        <div className="absolute inset-0 bg-black opacity-10"></div>

        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-32 h-32 bg-white opacity-5 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-48 h-48 bg-white opacity-5 rounded-full animate-pulse delay-1000"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-white opacity-5 rounded-full animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <span className="text-white text-sm font-medium">
              Process-Driven HR Management
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            About Procease HRMS
          </h1>
          <p className="text-xl md:text-2xl text-green-100 mb-8 max-w-4xl mx-auto leading-relaxed">
            A process-driven Human Resource Management platform created to help
            growing Indian SMEs build disciplined, scalable organizations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-green-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate("/login")}
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {/* <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600 transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate("/contact")}
            >
              Learn More
            </Button> */}
          </div>
        </div>
      </section>

      {/* Core Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
              <Target className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              We Exist to Solve a Fundamental Problem
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="text-xl text-gray-600 leading-relaxed">
                HR depends too much on people and too little on systems.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-2 border-gray-200 hover:border-green-500 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                  <div className="w-6 h-6 bg-red-600 rounded"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  The Problem
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  In many SMEs, HR works—but only as long as the right
                  individuals are present. When people change, processes break.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-6">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Our Solution
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Procease was created to ensure that HR continues to function
                  predictably, regardless of staff changes, scale, or growth
                  pressures.
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 border-2 border-gray-200 hover:border-green-500 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-2">
              <CardContent className="pt-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Our Focus
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Our focus is not automation for its own sake, but
                  institutionalizing HR discipline.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What We Bring Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-gray-50 to-green-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What Procease HRMS Brings
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We bring transformation where it matters most
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Structure
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Where operations are informal
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                <Lightbulb className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Clarity</h3>
              <p className="text-gray-600 leading-relaxed">
                Where decisions are ad hoc
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Continuity
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Where knowledge is person-dependent
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Philosophy
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              At Procease, we believe in principles that create lasting
              organizational strength
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {philosophyPoints.map((point, index) => (
              <Card
                key={index}
                className="p-6 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <CardContent className="pt-6">
                  <point.icon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {point.title}
                  </h3>
                  <p className="text-gray-600">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-block bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-lg">
              <p className="text-lg font-medium">
                Every decision we make is filtered through one question:
              </p>
              <p className="text-xl font-bold mt-2">
                "Will this make the organization more consistent and reliable?"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Who Procease Is Built For
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Procease HRMS is designed for organizations on a specific journey
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {targetAudience.map((audience, index) => (
              <Card
                key={index}
                className="p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <CardContent className="pt-6">
                  <audience.icon className="h-12 w-12 text-green-600 mb-6" />
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {audience.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {audience.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center bg-gradient-to-r from-green-600 to-emerald-600 text-white p-8 rounded-xl">
            <p className="text-lg font-medium mb-2">
              If your organization is moving from person-driven to
              process-driven,
            </p>
            <p className="text-xl font-bold">
              Procease is built for that journey.
            </p>
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Approach
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We approach HR systems the same way we approach business
              consulting
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {approachSteps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-6 transform hover:scale-110 transition-transform duration-300">
                    {step.step}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {index < approachSteps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-green-600 to-transparent"></div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 bg-gradient-to-r from-emerald-50 to-green-50 p-8 rounded-xl text-center">
            <p className="text-lg text-gray-700 leading-relaxed">
              This ensures the system is not just implemented—but used.
            </p>
          </div>
        </div>
      </section>

      {/* What Makes Us Different Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              What Makes Procease Different
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {differentiators.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-white rounded-lg hover:shadow-md transition-shadow duration-300"
                >
                  <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                  <p className="text-gray-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-8 rounded-xl text-white">
              <h3 className="text-2xl font-bold mb-6">Our Promise</h3>
              <p className="text-lg mb-6 leading-relaxed">
                We do not aim to be the loudest HRMS.
              </p>
              <p className="text-2xl font-bold leading-relaxed">
                We aim to be the most dependable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Our Commitment
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Procease HRMS is committed to helping organizations:
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Reduce Dependency
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Reduce operational dependency on individuals
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Create Continuity
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Create continuity in HR processes
                </p>
              </CardContent>
            </Card>

            <Card className="p-8 text-center hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Build Confidence
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Build confidence in people management
                </p>
              </CardContent>
            </Card>
          </div>

          {/* <div className="mt-16 text-center bg-gray-900 text-white p-12 rounded-xl">
            <p className="text-xl mb-4">We don't replace HR teams.</p>
            <p className="text-2xl font-bold">We strengthen them.</p>
          </div> */}
        </div>
      </section>

      {/* Final Tagline Section */}
      {/* <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img src={logo} alt="Procease HRMS Logo" className="h-20 w-20 mx-auto" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Procease HRMS
          </h1>
          <p className="text-2xl md:text-3xl text-green-100 font-medium leading-relaxed">
            Because organizations should run on systems, not memory.
          </p>
          
          <div className="mt-12">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-green-600 hover:bg-gray-100 transform hover:scale-105 transition-all duration-200"
              onClick={() => navigate("/login")}
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section> */}

      <Footer />
    </div>
  );
};

export default AboutPage;
