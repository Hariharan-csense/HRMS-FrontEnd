import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, AlertTriangle, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

const TermsConditions = () => {
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
            Terms and Conditions
          </h1>
          <p className="text-xl text-green-100 mb-8">
            Important information about using our HR management services.
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
              Welcome to CSENSE MANAGEMENT SOLUTIONS PRIVATE LIMITED ("we", "us", or "our"). By accessing and using our 
              HRMS assessment tools (collectively, the "Services"), you agree to comply with and be bound by the following Terms and Conditions (the "Terms"). 
              Please read them carefully. If you disagree with these Terms, please do not use our Services.
            </p>
          </div>

          {/* Services */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Services</h2>
            <p className="text-gray-600">
              CSENSE MANAGEMENT SOLUTIONS PRIVATE LIMITED provides online consulting assessment tools, including self-assessment of businesses 
              and individual capabilities. Upon payment, users can access these assessments and receive detailed reports.
            </p>
          </div>

          {/* Payment */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Payment</h2>
            <p className="text-gray-600">
              To access our assessment tools, you must complete payment via a third party payment gateway. All transactions are processed securely. 
              You agree to pay the specified fees for the Services by making a payment.
            </p>
          </div>

          {/* Refunds and Cancellations */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Refunds and Cancellations</h2>
            <p className="text-gray-600">
              All payments are non-refundable. Once a payment is made and access to the assessment is granted, no refunds or cancellations will be entertained.
            </p>
          </div>

          {/* User Account */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. User Account</h2>
            <p className="text-gray-600">
              To use our Services, you may need to create an account. You agree to provide accurate and complete information when registering 
              and to update such information as necessary. You are responsible for maintaining the confidentiality of your account credentials 
              and for all activities that occur under your account.
            </p>
          </div>

          {/* Intellectual Property */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
            <p className="text-gray-600">
              All content and materials provided on the Site, including but not limited to the CSense Wheel of Business and HRMS assessment tools, 
              are the property of CSENSE MANAGEMENT SOLUTIONS PRIVATE LIMITED and are protected by intellectual property laws. 
              Unauthorised use of our intellectual property is prohibited.
            </p>
          </div>

          {/* Limitation of Liability */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Limitation of Liability</h2>
            <p className="text-gray-600">
              To the fullest extent permitted by law, CSENSE MANAGEMENT SOLUTIONS PRIVATE LIMITED shall not be liable for any indirect, 
              incidental, consequential, or punitive damages arising from your use of the Site or Services.
            </p>
          </div>

          {/* Governing Law */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
            <p className="text-gray-600">
              These Terms are governed by and construed in accordance with the laws of India under Chennai jurisdictions. 
              Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts 
              in India under Chennai jurisdictions.
            </p>
          </div>

          {/* Changes to Terms */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Changes to Terms</h2>
            <p className="text-gray-600">
              We may update these Terms from time to time. Changes will be effective immediately upon posting on the Site. 
              Your continued use of the Services after any changes constitutes your acceptance of the new Terms.
            </p>
          </div>

          {/* Contact Information */}
          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">10. Contact Information</h2>
            <p className="text-gray-600 mb-4 text-center">
              For any questions regarding these Terms, please contact us at:
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

export default TermsConditions;
