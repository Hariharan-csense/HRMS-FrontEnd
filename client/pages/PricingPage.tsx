import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, ArrowLeft, Star, Zap, Shield, Loader2, Rocket, HelpCircle, MessageSquareText, RefreshCw, Users, X, ChevronRight } from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";
import Footer from "@/components/Footer";
import logo from "../assets/logo.png";

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  billing_cycle: string;
  description: string;
  features: string[];
  max_users: number;
  trial_days: number;
  is_popular: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}


const getStorageForPlan = (planName: string): string => {
  const name = planName.toLowerCase();
  
  if (name.includes('free')) {
    return '500MB';
  }
  
  if (name.includes('basic') || name.includes('starter')) {
    return '2GB';
  }
  
  if (name.includes('standard') || name.includes('professional') || name.includes('pro')) {
    return '5GB';
  }
  
  if (name.includes('advanced') || name.includes('business') || name.includes('premium') || name.includes('enterprise')) {
    return '10GB';
  }
  
  return '1GB'; // Default storage
};

const getYearlyPrice = (monthlyPrice: number): number => {
  // Calculate yearly price with 2 months discount (pay for 10 months, get 12)
  return Math.round(monthlyPrice * 10);
};

const formatPrice = (price: number): string => {
  return `₹${price.toLocaleString('en-IN')}`;
};

const PricingPage = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        const response = await ENDPOINTS.getSubscriptionPlans();
        
        // Handle the API response structure
        if (response?.data?.success && Array.isArray(response.data.data)) {
          // Transform the API data to match our component's expected format
          const formattedPlans = response.data.data.map(plan => ({
            id: plan.id,
            name: plan.name.charAt(0).toUpperCase() + plan.name.slice(1), // Capitalize first letter
            price: parseFloat(plan.price),
            billing_cycle: plan.billing_cycle,
            description: plan.description,
            features: plan.description.split('\n').filter(Boolean), // Split description into features array
            max_users: plan.max_users,
            trial_days: plan.trial_days,
            is_popular: plan.name.toLowerCase() === 'platinum',
            is_active: plan.is_active === 1,
            created_at: plan.created_at,
            updated_at: plan.updated_at
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
              <a href="/" className="text-gray-600 hover:text-green-600 transition-colors">Home</a>
              <a href="/features" className="text-gray-600 hover:text-green-600 transition-colors">Features</a>
              <a href="/pricing" className="font-medium text-green-600 border-b-2 border-green-600 pb-1">Pricing</a>
              <a href="/about" className="text-gray-600 hover:text-green-600 transition-colors">About</a>
              <a href="/contact" className="text-gray-600 hover:text-green-600 transition-colors">Contact</a>
            </nav>
            <Button 
              variant="outline" 
              className="border-green-600 text-green-600 hover:bg-green-50 hover:text-green-700 transition-colors"
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
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-green-100 bg-white/10 rounded-full mb-4">PRICING PLANS</span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-10">
            Choose the perfect plan for your business needs. No hidden fees, no surprises.
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-10">
            {[
              { icon: <Zap className="h-5 w-5" />, text: '14-day free trial' },
              { icon: <Shield className="h-5 w-5" />, text: 'Cancel anytime' },
              { icon: <Star className="h-5 w-5" />, text: 'No setup fees' }
            ].map((item, index) => (
              <div key={index} className="flex items-center bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
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
            className="bg-white text-green-700 hover:bg-gray-100 px-8 py-3 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => navigate("/signup")}
          >
            Start Free Trial
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Pricing Plans */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative
            before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/20 before:to-transparent before:rounded-xl
            before:blur-2xl before:-z-10 before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2
            before:w-3/4 before:h-3/4">
            
            {loading ? (
              <div className="col-span-3 flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="ml-2 text-gray-600">Loading plans...</span>
              </div>
            ) : error ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-red-500">{error}</p>
                <Button 
                  variant="outline" 
                  className="mt-4 border-green-600 text-green-600 hover:bg-green-50"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            ) : plans && plans.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {plans.map((plan, index) => {
                  const isMostPopular = plan.name.toLowerCase() === 'starter';
                  
                  return (
                    <div 
                      key={plan.id} 
                      className={`relative bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                        isMostPopular ? 'border-2 border-orange-400 ring-4 ring-orange-100' : 'border border-gray-200'
                      }`}
                    >
                      {isMostPopular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-400 to-orange-500 text-white text-center py-2 text-sm font-semibold">
                          Most Popular
                        </div>
                      )}
                      
                      <div className={`p-8 ${isMostPopular ? 'pt-12' : 'pt-8'}`}>
                        {/* User Icon */}
                        <div className="flex justify-center mb-6">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-gray-600" />
                          </div>
                        </div>
                        
                        {/* Plan Name */}
                        <h3 className="text-2xl font-bold text-center text-gray-900 mb-4">
                          {plan.name}
                        </h3>
                        
                        {/* Price - Yearly Only */}
                        <div className="text-center mb-6">
                          <div className="bg-green-50 rounded-lg p-4 mt-2">
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-5xl font-bold text-green-700">
                                {plan.price > 0 ? formatPrice(getYearlyPrice(plan.price)) : '₹0'}
                              </span>
                              <span className="text-green-600 font-semibold text-xl">/year</span>
                            </div>
                          </div>
                          {plan.price > 0 && (
                            <span className="text-gray-500 text-sm mt-3 block">+ Taxes</span>
                          )}
                        </div>
                        
                        {/* User/Storage Details */}
                        <div className="text-center mb-8">
                          <p className="text-gray-700 font-medium">
                            Up to {plan.max_users} Users, {getStorageForPlan(plan.name)} Storage
                          </p>
                        </div>
                        
                        {/* Plan Description with Bullet Points */}
                        <div className="space-y-3 mb-8">
                          {plan.description.split('\n').map((item, index) => (
                            <div key={index} className="flex items-center justify-between py-2">
                              <span className="text-gray-700 text-sm flex-1">{item}</span>
                              <div className="flex items-center justify-center w-6 h-6">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* CTA Button */}
                        <Button 
                          className={`w-full py-3 font-semibold transition-all duration-200 ${
                            isMostPopular 
                              ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                              : 'bg-white border-2 border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          onClick={() => navigate("/signup")}
                        >
                          Try Everything Free!
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                        
                        {/* Trial Information */}
                        <div className="text-center mt-4">
                          <p className="text-gray-600 text-sm">
                            {plan.trial_days} days free trial
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            Then {plan.price === 0 ? '₹0/month' : `${formatPrice(plan.price)}/month or ${formatPrice(getYearlyPrice(plan.price))}/year`}
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
                  <p className="text-gray-600">No subscription plans available at the moment.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4 border-green-600 text-green-600 hover:bg-green-50"
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
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans. Can't find the answer you're looking for?
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { 
                q: "Can I change my plan later?", 
                a: "Absolutely! You can upgrade or downgrade your plan at any time. Your billing will be prorated accordingly." 
              },
              { 
                q: "Is there a free trial?", 
                a: "Yes, we offer a 14-day free trial for all our plans. No credit card is required to start your trial." 
              },
              { 
                q: "What payment methods do you accept?", 
                a: "We accept all major credit cards, PayPal, and bank transfers. We use Stripe for secure payment processing." 
              },
              { 
                q: "Do you offer annual billing discounts?", 
                a: "Yes! Save up to 20% when you choose annual billing instead of monthly. The discount is automatically applied at checkout." 
              },
              { 
                q: "Can I cancel anytime?", 
                a: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees." 
              },
              { 
                q: "What support is included?", 
                a: "All plans include email support. Higher tier plans include priority support with faster response times." 
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className="group bg-white border border-gray-100 rounded-xl p-6 hover:shadow-lg transition-shadow duration-300"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                  <span className="bg-green-100 text-green-600 rounded-full p-1.5 mr-3">
                    <HelpCircle className="h-4 w-4" />
                  </span>
                  {faq.q}
                </h3>
                <p className="text-gray-600 pl-9">{faq.a}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-6">Still have questions?</p>
            <Button 
              variant="outline" 
              className="border-green-600 text-green-600 hover:bg-green-50"
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
            <span className="text-sm font-medium text-white">READY TO GET STARTED?</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Transform your HR management today
          </h2>
          <p className="text-xl text-green-100 mb-10 max-w-2xl mx-auto">
            Join thousands of companies that trust our platform to streamline their HR processes and grow their business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-green-700 hover:bg-gray-100 px-8 py-6 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => navigate("/login")}
            >
              <Zap className="h-5 w-5 mr-2" />
              Start 14-Day Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white/10 hover:text-white px-8 py-6 text-base font-medium rounded-lg transition-all duration-300"
              onClick={() => navigate("/contact")}
            >
              <MessageSquareText className="h-5 w-5 mr-2" />
              Talk to Sales
            </Button>
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
