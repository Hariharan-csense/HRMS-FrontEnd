import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Eye, Lock, Database } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const PrivacyPolicy = () => {
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
            Privacy Policy
          </h1>
          <p className="text-xl text-green-100 mb-8">
            Your privacy is our priority. Learn how we protect and handle your data.
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
              CSENSE MANAGEMENT SOLUTIONS PRIVATE LIMITED ("we", "us", or "our") is committed to protecting your privacy. 
              This Privacy Policy explains how we collect, use, and protect your personal information when you use our 
              HRMS assessment tools (collectively, the "Services").
            </p>
          </div>

          {/* Information We Collect */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <p className="text-gray-600 mb-4">We collect the following types of information:</p>
            <div className="space-y-4 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900">Personal Information:</h4>
                <p>When you register for an account or make a payment, we may collect personal information such as your name, email address, and payment details.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Usage Data:</h4>
                <p>We collect information about how you use our Site and Services, including IP addresses, browser types, and access times.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Cookies:</h4>
                <p>We use cookies to enhance your experience on our Site. You can control cookies through your browser settings.</p>
              </div>
            </div>
          </div>

          {/* How We Use Your Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 mb-4">We use your information for the following purposes:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>To process payments and provide access to our assessment tools.</li>
              <li>To communicate with you regarding your account and Services.</li>
              <li>To improve our Site and Services based on usage data.</li>
              <li>To send you promotional information if you have opted in to receive it.</li>
            </ul>
          </div>

          {/* Data Sharing and Disclosure */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-gray-600 mb-4">We do not sell or rent your personal information to third parties. We may share your information with:</p>
            <div className="space-y-4 text-gray-600">
              <div>
                <h4 className="font-semibold text-gray-900">Service Providers:</h4>
                <p>We use third-party service providers, such as Razorpay, to process payments. These providers are obligated to protect your information and use it only for the purpose of providing their services.</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Legal Requirements:</h4>
                <p>We may disclose your information if required to do so by law or in response to valid requests by public authorities.</p>
              </div>
            </div>
          </div>

          {/* Data Security */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600">
              We implement reasonable security measures to protect your personal information from unauthorised access, use, or disclosure. 
              However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.
            </p>
          </div>

          {/* Your Rights */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-600">
              You have the right to access, correct, or delete your personal information. You may also opt out of receiving promotional communications 
              from us at any time by following the instructions provided in those communications.
            </p>
          </div>

          {/* Changes to the Privacy Policy */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Changes to the Privacy Policy</h2>
            <p className="text-gray-600">
              We may update this Privacy Policy from time to time. Changes will be effective immediately upon posting on the Site. 
              Your continued use of the Services after any changes constitutes your acceptance of the updated Privacy Policy.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">8. Contact Information</h2>
            <p className="text-gray-600 mb-4 text-center">
              If you have any questions or concerns about this Privacy Policy, please contact us at:
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

export default PrivacyPolicy;
