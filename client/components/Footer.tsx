import React from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
const Footer = () => {
  return (
    <footer className="bg-gray-200 text-gray-800 py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }
        
        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }
        
        .animate-pulse-hover:hover {
          animation: pulse 0.3s ease-in-out;
        }
        
        .footer-link {
          position: relative;
          transition: all 0.3s ease;
        }
        
        .footer-link::before {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #10b981, #059669);
          transition: width 0.3s ease;
        }
        
        .footer-link:hover::before {
          width: 100%;
        }
        
        .footer-logo {
          transition: transform 0.3s ease, filter 0.3s ease;
        }
        
        .footer-logo:hover {
          transform: rotate(5deg) scale(1.1);
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        }
        
        .footer-grid > div {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .footer-grid > div:hover {
          transform: translateY(-5px);
        }
        
        .footer-bottom {
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent);
          transition: background 0.3s ease;
        }
        
        .footer-bottom:hover {
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2), transparent);
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 footer-grid">
          <div className="animate-slide-in-left">
            <div className="flex items-center mb-4">
              <img src={logo} alt="HRMS Logo" className="h-16 w-16 mr-3 footer-logo" />
              {/* <h3 className="text-lg font-semibold">HRMS</h3> */}
            </div>
            <p className="text-gray-600">Comprehensive HR management solution for modern businesses.</p>
          </div>
          <div className="animate-slide-in-left" style={{animationDelay: '0.1s'}}>
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link to="/features" className="footer-link hover:text-gray-900 transition-colors">Features</Link></li>
              <li><Link to="/pricing" className="footer-link hover:text-gray-900 transition-colors">Pricing</Link></li>
              {/* <li><a href="/security" className="footer-link hover:text-gray-900 transition-colors">Security</a></li> */}
            </ul>
          </div>
          <div className="animate-slide-in-right" style={{animationDelay: '0.2s'}}>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link to="/about" className="footer-link hover:text-gray-900 transition-colors">About Us</Link></li>
              {/* <li><a href="/careers" className="footer-link hover:text-gray-900 transition-colors">Careers</a></li> */}
              <li><Link to="/contact" className="footer-link hover:text-gray-900 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div className="animate-slide-in-right" style={{animationDelay: '0.3s'}}>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-600">
              <li><Link to="/privacy-policy" className="footer-link hover:text-gray-900 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="footer-link hover:text-gray-900 transition-colors">Terms and Conditions</Link></li>
              <li><Link to="/refund-cancellation" className="footer-link hover:text-gray-900 transition-colors">Refund and Cancellation Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-400 mt-8 pt-8 text-center text-gray-500 footer-bottom">
          <p className="animate-pulse-hover">&copy; {new Date().getFullYear()} Procease HRMS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
