import { AddonIllustration } from "@/components/AddonIllustration";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  ArrowLeft,
  Star,
  Zap,
  Shield,
  Loader2,
  Rocket,
  HelpCircle,
  MessageSquareText,
  RefreshCw,
  Users,
  X,
  ChevronRight,
} from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";
import Footer from "@/components/Footer";
import logo from "../assets/logo.png";
import { isCordovaIOS } from "@/lib/platform";

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  yearly_price?: number;
  description: string;
  features: string[];
  max_users: number;
  storage_gb?: number;
  trial_days: number;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface SubscriptionAddon {
  id: number;
  name: string;
  module_key?: string;
  description?: string;
  price_upto5?: number;
  price_upto10?: number;
  price_upto15?: number;
  price_upto25?: number;
  price_upto50?: number;
  price_above50?: number;
  is_active?: boolean | number;
}

const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString("en-IN")}`;
};

const formatCurrency = (price: number): string => {
  return `\u20B9${price.toLocaleString("en-IN")}`;
};

const getAddonPrice = (addon: SubscriptionAddon, users: number): number => {
  if (users <= 5) return Number(addon.price_upto5 ?? addon.price_upto25 ?? 0);
  if (users <= 10)
    return Number(
      addon.price_upto10 ?? addon.price_upto50 ?? addon.price_upto5 ?? 0,
    );
  return Number(
    addon.price_upto15 ??
      addon.price_above50 ??
      addon.price_upto50 ??
      addon.price_upto10 ??
      0,
  );
};

const getPricingSummary = (
  plan: SubscriptionPlan,
  usersCount: number,
  billingCycle: "monthly" | "yearly",
) => {
  const monthlyPerUser = Number(plan.price || 0);
  const yearlyPerUserMonthly = Number(plan.yearly_price || 0);
  const effectivePerUser =
    billingCycle === "yearly" ? yearlyPerUserMonthly : monthlyPerUser;
  const totalPrice =
    effectivePerUser * usersCount * (billingCycle === "yearly" ? 12 : 1);

  return {
    monthlyPerUser,
    yearlyPerUserMonthly,
    effectivePerUser,
    savingsPerUser: Number((monthlyPerUser - yearlyPerUserMonthly).toFixed(2)),
    totalPrice,
  };
};

const PricingPage = () => {
  const navigate = useNavigate();
  const hideRegistration = isCordovaIOS();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [addons, setAddons] = useState<SubscriptionAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState(25);
  const [selectedUsersInput, setSelectedUsersInput] = useState("25");
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<
    "monthly" | "yearly"
  >("monthly");

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await ENDPOINTS.getSubscriptionPlans();

        // Handle the API response structure
        if (response?.data?.success && Array.isArray(response.data.data)) {
          // Transform the API data to match our component's expected format
          const formattedPlans = response.data.data.map((plan) => ({
            id: plan.id,
            name: plan.name.charAt(0).toUpperCase() + plan.name.slice(1), // Capitalize first letter
            price: parseFloat(plan.price),
            yearly_price: plan.yearly_price,
            description: plan.description,
            features: plan.description.split("\n").filter(Boolean), // Split description into features array
            max_users: plan.max_users,
            storage_gb: plan.storage_gb,
            trial_days: plan.trial_days,
            is_popular: plan.name.toLowerCase() === "standard",
            is_active: plan.is_active === 1,
            created_at: plan.created_at,
            updated_at: plan.updated_at,
          }));

          setPlans(formattedPlans);
        } else {
          setPlans([]);
        }
      } catch (err) {
        console.error("Error fetching subscription plans:", err);
        setError("Failed to load subscription plans. Please try again later.");
        setPlans([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const response = await ENDPOINTS.getPublicSubscriptionAddons();
        const activeAddons = Array.isArray(response?.data?.data)
          ? response.data.data.filter(
              (addon: SubscriptionAddon) =>
                addon.is_active !== false &&
                addon.is_active !== 0 &&
                !`${addon.module_key || ""} ${addon.name || ""}`
                  .toLowerCase()
                  .includes("kpi"),
            )
          : [];
        setAddons(activeAddons);
      } catch (err) {
        console.error("Error fetching public subscription add-ons:", err);
        setAddons([]);
      }
    };

    fetchAddons();
  }, []);

  const handleSignupAction = () => {
    navigate(hideRegistration ? "/login" : "/signup");
  };

  return (
    <div className="min-h-screen bg-[#fffdfd] text-black">
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/">
            <img
              src={logo}
              alt="HRMS Logo"
              className="h-14 w-14 object-contain"
            />
          </a>
          <nav className="hidden items-center gap-9 text-base font-semibold text-black md:flex">
            <a href="/">Home</a>
            <a href="/features">Features</a>
            <a href="/pricing" className="font-bold text-black">
              Pricing
            </a>
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
        <section className="px-5 pb-8 pt-12 text-center sm:pt-16">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.25em] text-black">
            Pricing plans
          </p>
          <h1 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-black sm:text-4xl">
            Simple pricing that grows with you
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-sm text-black">
            Choose the perfect plan for your business needs. No hidden fees, no
            surprises.
          </p>
          <div className="mx-auto mt-8 max-w-4xl rounded-3xl border-2 border-[#17c491] bg-[#effff9] p-4 shadow-sm sm:p-7">
            <div className="rounded-2xl bg-white px-4 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-center gap-2 text-2xl text-black sm:text-3xl">
                <span>Get instant estimate for</span>
                <input
                  type="number"
                  min="1"
                  value={selectedUsersInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSelectedUsersInput(value);
                    if (value)
                      setSelectedUsers(Math.max(1, parseInt(value, 10) || 1));
                  }}
                  onBlur={() => {
                    const value = Math.max(
                      1,
                      parseInt(selectedUsersInput, 10) || 1,
                    );
                    setSelectedUsers(value);
                    setSelectedUsersInput(String(value));
                  }}
                  className="w-28 rounded-xl border border-[#17c491] bg-[#effff9] px-2 py-1 text-center text-2xl font-bold text-black outline-none focus:ring-2 focus:ring-[#17c491]/20"
                />
                <span>employees</span>
              </div>
              <input
                type="range"
                min="10"
                max="3000"
                step="10"
                value={Math.min(3000, Math.max(10, selectedUsers))}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setSelectedUsers(value);
                  setSelectedUsersInput(String(value));
                }}
                aria-label="Number of employees"
                className="mt-6 h-2 w-full cursor-pointer accent-[#17c491]"
                style={{ accentColor: "#17c491" }}
              />
              <div className="mt-2 flex justify-between text-xs font-medium text-black">
                <span>10</span>
                <span>500</span>
                <span>1,000</span>
                <span>2,000</span>
                <span>3,000+</span>
              </div>
            </div>
            <div className="mt-4 flex flex-col items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 sm:flex-row">
              <label className="flex items-center gap-2 text-xs font-semibold text-black">
                Billing cycle
              </label>
              <div className="flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
                {(["monthly", "yearly"] as const).map((cycle) => (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setSelectedBillingCycle(cycle)}
                    className={`rounded-full px-5 py-2 capitalize transition ${selectedBillingCycle === cycle ? "bg-[#17c491] text-white shadow-sm" : "text-black"}`}
                  >
                    {cycle}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="px-5 pb-14">
          <div className="mx-auto max-w-6xl">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-7 w-7 animate-spin text-black" />
              </div>
            ) : error ? (
              <div className="py-12 text-center text-black">{error}</div>
            ) : plans.length > 0 ? (
              <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => {
                  const isMostPopular = plan.name.toLowerCase() === "standard";
                  const pricing = getPricingSummary(
                    plan,
                    selectedUsers,
                    selectedBillingCycle,
                  );
                  return (
                    <div
                      key={plan.id}
                      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8 ${isMostPopular ? "border-[#17c491] bg-gradient-to-b from-[#effff9] to-white shadow-md shadow-emerald-100" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <div className={`absolute inset-x-0 top-0 h-1.5 ${isMostPopular ? "bg-gradient-to-r from-[#17c491] to-teal-400" : "bg-gradient-to-r from-slate-200 to-slate-300"}`} />
                      {isMostPopular && (
                        <div className="absolute right-4 top-4 rounded-full bg-[#17c491] px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                          Most Popular
                        </div>
                      )}
                      <h3 className="mb-3 mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {plan.name}
                      </h3>
                      <p className="mb-6 min-h-12 border-b border-slate-200/70 pb-6 text-base leading-6 text-slate-600">
                        {plan.description.split("\n")[0]}
                      </p>
                      <div className={`mb-5 rounded-xl border p-4 ${isMostPopular ? "border-emerald-100 bg-white/80" : "border-slate-100 bg-slate-50/70"}`}>
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                            {formatCurrency(pricing.effectivePerUser)}
                          </span>
                          <span className="text-sm font-semibold text-slate-500">
                            /month
                          </span>
                        </div>
                        <span className="mt-3 block border-t border-slate-100 pt-3 text-sm font-medium text-slate-600">
                          Total {selectedBillingCycle}:{" "}
                          {formatCurrency(pricing.totalPrice)} for{" "}
                          {selectedUsers} users
                        </span>
                      </div>
                      <div className="mb-7 flex-1 space-y-1.5">
                        {plan.description
                          .split("\n")
                          .filter(Boolean)
                          .map((item, index) => {
                            const isAddon = item.toLowerCase().includes("add-on");
                            return (
                            <div
                              key={index}
                              className={`flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors ${isAddon ? "bg-amber-50/70" : "hover:bg-slate-50"}`}
                            >
                              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isAddon ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {isAddon ? <span className="text-sm font-bold">+</span> : <Check className="h-3.5 w-3.5" />}
                              </span>
                              <span className="flex-1 text-sm leading-6 text-slate-700">
                                {item.replace(/\s*\(add-on\)/i, "")}
                                {isAddon && <span className="ml-1.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-800">Add-on</span>}
                              </span>
                            </div>
                          );})}
                      </div>
                      <Button
                        className={`w-full rounded-full py-3 text-sm font-semibold ${isMostPopular ? "bg-[#17c491] text-white hover:bg-[#139f78]" : "border border-[#17c491] bg-white text-black hover:bg-[#effff9]"}`}
                        onClick={handleSignupAction}
                      >
                        {hideRegistration ? "Sign In" : "Try Everything Free!"}
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="mt-4 text-center text-xs text-black">
                        Billed {selectedBillingCycle}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-black">
                No subscription plans available at the moment.
              </div>
            )}
          </div>
        </section>
        <section className="border-y border-emerald-100 bg-[#f1fffb] px-5 py-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-7 text-center">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.25em] text-black">
                Extend your workspace
              </p>
              <h2 className="text-2xl font-bold text-black">
                Power up with add-ons
              </h2>
              <p className="mt-2 text-xs text-black">
                Add the tools your team needs as you grow.
              </p>
            </div>
            <div className="flex flex-wrap items-stretch justify-center gap-4">
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="relative flex w-full max-w-[280px] min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  {addon.id === addons[0]?.id && (
                    <span className="absolute right-3 top-3 rounded-full bg-[#ffe5a8] px-2 py-1 text-[10px] font-semibold text-black">
                      NEW
                    </span>
                  )}
                  <AddonIllustration
                    moduleKey={addon.module_key}
                    className="mb-2 !h-20 !w-32"
                  />
                  <h3 className="break-words text-sm font-bold text-black">
                    {addon.name}
                  </h3>
                  <p className="mt-1 flex-1 break-words text-xs leading-5 text-black">
                    {addon.description ||
                      "Extend your HR workspace with this add-on module."}
                  </p>
                  <div className="mt-3 border-l-4 border-[#17c491] pl-3">
                    <p className="text-xl font-bold text-black">
                      {formatCurrency(getAddonPrice(addon, selectedUsers))}{" "}
                      <span className="text-xs font-normal text-black">
                        /user/month
                      </span>
                    </p>
                    <p className="text-[10px] text-black">
                      For {selectedUsers} employees
                    </p>
                  </div>
                  <Button
                    onClick={handleSignupAction}
                    className="mt-3 h-9 w-full rounded-lg border border-[#17c491] bg-white px-3 py-2 text-xs text-black hover:bg-[#17c491] hover:text-white"
                  >
                    Explore add-on
                    <ChevronRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-[#17c491] px-5 py-14 text-center text-white">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/80">
            From cost to value
          </p>
          <h2 className="text-2xl font-bold">Try everything free</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-white/90">
            No credit card required. Cancel anytime and keep your team moving
            forward.
          </p>
          <Button
            onClick={handleSignupAction}
            className="mt-7 rounded-full bg-white px-7 text-sm text-black hover:bg-[#effff9]"
          >
            {hideRegistration ? "Sign In" : "Start Free Trial"}
          </Button>
        </section>
        <section className="bg-[#fff6df] px-5 py-10">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-black">
              Frequently Asked Questions
            </h2>
            <div className="mt-6 grid gap-2 text-left md:grid-cols-2">
              {[
                "Can I change my plan later?",
                "Is there a free trial?",
                "What payment methods do you accept?",
                "Do you offer yearly billing?",
                "Can I cancel anytime?",
                "What support is included?",
              ].map((question) => (
                <div
                  key={question}
                  className="flex items-center justify-between rounded-lg bg-white px-4 py-3 text-xs font-semibold text-black shadow-sm"
                >
                  <span>{question}</span>
                  <ChevronRight className="h-4 w-4 rotate-90 text-black" />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center">
              <img src={logo} alt="HRMS Logo" className="h-16 w-16 mr-2" />
              {/* <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">HRMS</span> */}
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="/"
                className="text-black hover:text-black transition-colors"
              >
                Home
              </a>
              <a
                href="/features"
                className="text-black hover:text-black transition-colors"
              >
                Features
              </a>
              <a
                href="/pricing"
                className="font-medium text-black border-b-2 border-green-600 pb-1"
              >
                Pricing
              </a>
              <a
                href="/about"
                className="text-black hover:text-black transition-colors"
              >
                About
              </a>
              <a
                href="/contact"
                className="text-black hover:text-black transition-colors"
              >
                Contact
              </a>
            </nav>
            <Button
              variant="outline"
              className="border-green-600 text-black hover:bg-green-50 hover:text-black transition-colors"
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIzIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="relative max-w-5xl mx-auto text-center">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-green-100 bg-white/10 rounded-full mb-4">
            PRICING PLANS
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-10">
            Choose the perfect plan for your business needs. No hidden fees, no
            surprises.
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { icon: <Zap className="h-5 w-5" />, text: "14-day free trial" },
              { icon: <Shield className="h-5 w-5" />, text: "Cancel anytime" },
              { icon: <Star className="h-5 w-5" />, text: "No setup fees" },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full"
              >
                <span className="text-green-100 mr-2">{item.icon}</span>
                <span className="text-green-50 font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Try Everything Free Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Try Everything Free
          </h2>
          <p className="text-green-100 text-lg mb-6">
            No credit card required • Cancel anytime
          </p>
          <Button
            size="lg"
            className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={handleSignupAction}
          >
            {hideRegistration ? "Sign In" : "Start Free Trial"}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Pricing Plans */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Card className="border border-gray-200 shadow-sm mb-8">
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-black font-medium">
                    Number of Users
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={selectedUsersInput}
                    onChange={(e) => {
                      const rawValue = e.target.value;
                      setSelectedUsersInput(rawValue);

                      if (rawValue === "") return;

                      const nextValue = parseInt(rawValue, 10);
                      if (!Number.isNaN(nextValue)) {
                        setSelectedUsers(Math.max(1, nextValue));
                      }
                    }}
                    onBlur={() => {
                      const nextValue = parseInt(selectedUsersInput, 10);
                      const normalizedValue = Number.isNaN(nextValue)
                        ? 1
                        : Math.max(1, nextValue);

                      setSelectedUsers(normalizedValue);
                      setSelectedUsersInput(String(normalizedValue));
                    }}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-black font-medium">
                    Billing Cycle
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["monthly", "yearly"] as const).map((cycle) => (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => setSelectedBillingCycle(cycle)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                          selectedBillingCycle === cycle
                            ? "border-green-600 bg-green-50 text-black"
                            : "border-gray-300 text-black hover:bg-gray-50"
                        }`}
                      >
                        {cycle === "monthly" ? "Monthly" : "Yearly"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <div
            className="relative
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/20 before:to-transparent before:rounded-xl
            before:blur-2xl before:-z-10 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
            before:w-3/4 before:h-3/4"
          >
            {loading ? (
              <div className="col-span-3 flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-black" />
                <span className="ml-2 text-black">Loading plans...</span>
              </div>
            ) : error ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-black">{error}</p>
                <Button
                  variant="outline"
                  className="mt-4 border-green-600 text-black hover:bg-green-50"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : plans && plans.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan) => {
                  const isMostPopular = plan.name.toLowerCase() === "standard";
                  const pricing = getPricingSummary(
                    plan,
                    selectedUsers,
                    selectedBillingCycle,
                  );

                  return (
                    <div
                      key={plan.id}
                      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                        isMostPopular
                          ? "ring-emerald-300 hover:shadow-emerald-100"
                          : "ring-slate-200 hover:shadow-slate-200"
                      }`}
                    >
                      <div className={`h-1.5 w-full ${isMostPopular ? "bg-gradient-to-r from-emerald-400 to-teal-500" : "bg-gradient-to-r from-slate-200 to-slate-300"}`} />
                      {isMostPopular && (
                        <div className="bg-emerald-50 text-emerald-800 text-center py-2 text-xs font-bold uppercase tracking-widest">
                          Most Popular · Recommended
                        </div>
                      )}

                      <div
                        className="flex flex-1 flex-col p-6 sm:p-7"
                      >
                        {/* User Icon */}
                        <div className="mb-4 flex justify-center">
                          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${isMostPopular ? "bg-emerald-100" : "bg-slate-100"}`}>
                            <Users className={`h-7 w-7 ${isMostPopular ? "text-emerald-700" : "text-slate-600"}`} />
                          </div>
                        </div>

                        {/* Plan Name */}
                        <h3 className="mb-4 text-center text-2xl font-bold tracking-tight text-slate-900">
                          {plan.name}
                        </h3>

                        {/* Price */}
                        <div className={`mb-6 rounded-2xl border p-4 text-center ${isMostPopular ? "border-emerald-100 bg-emerald-50/60" : "border-slate-100 bg-slate-50/70"}`}>
                          <div className="flex items-baseline justify-center gap-1">
                            <span className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                              {formatCurrency(pricing.effectivePerUser)}
                            </span>
                            <span className="text-slate-500 font-medium text-lg">
                              /month
                            </span>
                          </div>
                          <span className="mt-2 block text-sm text-slate-500">
                            Monthly: {formatCurrency(pricing.monthlyPerUser)}
                            {selectedBillingCycle === "yearly"
                              ? ` • Yearly: ${formatCurrency(pricing.yearlyPerUserMonthly)} / month`
                              : ""}
                          </span>
                          {selectedBillingCycle === "yearly" && (
                            <span className="text-black text-sm block"></span>
                          )}
                          <span className="mt-3 block border-t border-slate-200/80 pt-3 text-sm font-medium text-slate-700">
                            Total {selectedBillingCycle}:{" "}
                            {formatCurrency(pricing.totalPrice)} for{" "}
                            {selectedUsers} users
                          </span>
                        </div>

                        {/* User/Storage Details removed */}

                        {/* Plan Description with Bullet Points */}
                        <div className="mb-8 flex-1">
                          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">Included modules <span className="h-px flex-1 bg-slate-100" /></p>
                          <div className="space-y-1.5">
                          {plan.description.split("\n").filter(Boolean).map((item, index) => {
                            const isAddon = item.toLowerCase().includes("add-on");
                            return (
                            <div
                              key={index}
                              className={`flex items-start gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-colors ${isAddon ? "bg-amber-50/70" : "hover:bg-slate-50"}`}
                            >
                              <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${isAddon ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
                                {isAddon ? <span className="text-sm font-bold">+</span> : <Check className="h-3 w-3" />}
                              </div>
                              <span className="flex-1 leading-5 text-slate-700">{item.replace(/\s*\(add-on\)/i, "")}{isAddon && <span className="ml-1.5 inline-flex rounded-full bg-amber-100 px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-amber-800">Add-on</span>}</span>
                            </div>
                          );})}
                          </div>
                        </div>

                        {/* CTA Button */}
                        <Button
                          className={`w-full py-3 font-semibold transition-all duration-200 ${
                            isMostPopular
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "border border-slate-200 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50"
                          }`}
                          onClick={handleSignupAction}
                        >
                          {hideRegistration
                            ? "Sign In"
                            : "Try Everything Free!"}
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>

                        {/* Trial Information */}
                        <div className="text-center mt-4">
                          {/* <p className="text-black text-sm">
                            {plan.trial_days} days free trial
                          </p> */}
                          <p className="text-black text-xs mt-1">
                            Billed {selectedBillingCycle}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="col-span-3 text-center py-12">
                <div className="bg-white/80 backdrop-blur-sm p-8 rounded-xl shadow-lg inline-block">
                  <p className="text-black">
                    No subscription plans available at the moment.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 border-green-600 text-black hover:bg-green-50"
                    onClick={() => window.location.reload()}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-black max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans. Can't
              find the answer you're looking for?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "Can I change my plan later?",
                a: "Absolutely! You can upgrade or downgrade your plan at any time. Your billing will be prorated accordingly.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes, we offer a 14-day free trial for all our plans. No credit card is required to start your trial.",
              },
              {
                q: "What payment methods do you accept?",
                a: "We accept all major credit cards, PayPal, and bank transfers. We use Stripe for secure payment processing.",
              },
              {
                q: "Do you offer yearly billing?",
                a: "Yes. Yearly pricing is configured separately for each package, and the saved yearly rate is shown automatically throughout the app.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees.",
              },
              {
                q: "What support is included?",
                a: "All plans include email support. Higher tier plans include priority support with faster response times.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="group bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="text-lg font-semibold text-black mb-2 flex items-center">
                  <span className="bg-green-100 text-black rounded-full p-1.5 mr-3">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  {faq.q}
                </h3>
                <p className="text-black pl-9">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-black mb-6">Still have questions?</p>
            <Button
              variant="outline"
              className="border-green-600 text-black hover:bg-green-50"
              onClick={() => navigate("/contact")}
            >
              <MessageSquareText className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIzIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-10"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full mb-6">
            <span className="text-sm font-medium text-white">
              READY TO GET STARTED?
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Transform your HR management today
          </h2>
          <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            Join thousands of companies that trust our platform to streamline
            their HR processes and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-black hover:bg-gray-100 px-8 py-6 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate("/login")}
            >
              <Zap className="h-5 w-5 mr-2" />
              {hideRegistration ? "Sign In" : "Start 14-Day Free Trial"}
            </Button>
            {/* <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white/10 hover:text-white px-8 py-6 text-base font-medium rounded-lg transition-all duration-300"
              onClick={() => navigate("/contact")}
            >
              <MessageSquareText className="h-5 w-5 mr-2" />
              Talk to Sales
            </Button> */}
          </div>
          <p className="text-green-100 text-sm mt-6">
            No credit card required • Cancel anytime • 24/7 Support
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
