import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, DollarSign, Calendar, AlertCircle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const RefundCancellation = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center">
              <img src={logo} alt="HRMS Logo" className="h-20 w-20 mr-2" />
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-gray-900 transition-colors">Home</a>
              <a href="/features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a>
              <a href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="/about" className="text-gray-700 hover:text-gray-900 transition-colors">About</a>
              <a href="/contact" className="text-gray-700 hover:text-gray-900 transition-colors">Contact</a>
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
            Refund and Cancellation Policy
          </h1>
          <p className="text-xl text-green-100 mb-8">
            Clear guidelines for refunds and cancellations to ensure fairness for all customers.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="flex justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
          {/* Introduction */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              CSENSE MANAGEMENT SOLUTIONS PRIVATE LIMITED strives to provide high-quality consulting assessment tools. 
              This Refund and Cancellation Policy outlines the terms and conditions under which refunds 
              and cancellations are processed for our HRMS assessment tools (collectively, the "Services").
            </p>
          </div>

          {/* No Refunds */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. No Refunds</h2>
            <p className="text-gray-600">
              All payments for our Services are non-refundable. Once a payment is processed and access to the assessment tools is granted, 
              you are not entitled to a refund. This policy applies to all purchases of our Services.
            </p>
          </div>

          {/* Cancellations */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cancellations</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900">Before Payment:</h4>
                <p>If you wish to cancel your order before completing the payment process, you may do so without incurring any charges. 
                Simply do not complete the transaction.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">After Payment:</h4>
                <p>Once the payment has been completed and access to the assessment tools is granted, cancellations are not permitted, 
                and no refunds will be provided.</p>
              </div>
            </div>
          </div>

          {/* Access to Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Access to Services</h2>
            <p className="text-gray-600">
              Upon successful payment, you will receive access to the assessment tools. If you encounter any issues accessing the Services 
              or have technical difficulties, please contact our support team immediately. We will assist you in resolving any access issues, 
              but please note that this does not constitute a basis for a refund.
            </p>
          </div>

          {/* Changes to Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Changes to Services</h2>
            <p className="text-gray-600">
              CSENSE MANAGEMENT SOLUTIONS PRIVATE LIMITED reserves the right to modify, suspend, or discontinue any of our Services. 
              In the event of such changes, no refunds will be issued for any payments made before the modification, suspension, or discontinuation.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">6. Contact Information</h2>
            <p className="text-gray-600 mb-4 text-center">
              For any questions regarding our Refund and Cancellation Policy, or if you need assistance with our Services, please contact us at:
            </p>
            <div className="space-y-2 text-sm text-gray-600 text-center">
              <p><strong>CSENSE MANAGEMENT SOLUTIONS PRIVATE LIMITED</strong></p>
              <p>106, First Floor, Osian Chloroplaza, Link Road, Porur. Chennai 600116</p>
              <p><strong>Email:</strong> support@procease.co</p>
              <p><strong>Phone:</strong> + 91 9042894918</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-200 text-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img src={logo} alt="HRMS Logo" className="h-16 w-16 mr-3" />
                {/* <h3 className="text-lg font-semibold">HRMS</h3> */}
              </div>
              <p className="text-gray-600">Comprehensive HR management solution for modern businesses.</p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="/features" className="hover:text-gray-900 transition-colors">Features</a></li>
                <li><a href="/pricing" className="hover:text-gray-900 transition-colors">Pricing</a></li>
                <li><a href="/security" className="hover:text-gray-900 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="/about" className="hover:text-gray-900 transition-colors">About Us</a></li>
                <li><a href="/careers" className="hover:text-gray-900 transition-colors">Careers</a></li>
                <li><a href="/contact" className="hover:text-gray-900 transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-600">
                <li><a href="/privacy-policy" className="hover:text-gray-900 transition-colors">Privacy Policy</a></li>
                <li><a href="/terms-conditions" className="hover:text-gray-900 transition-colors">Terms and Conditions</a></li>
                <li><a href="/refund-cancellation" className="hover:text-gray-900 transition-colors">Refund and Cancellation Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-400 mt-8 pt-8 text-center text-gray-500">
            <p>&copy; {new Date().getFullYear()} HRMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RefundCancellation;
