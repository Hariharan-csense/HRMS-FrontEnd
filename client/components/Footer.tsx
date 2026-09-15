import React from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import logo from "../assets/logo.png";

// Add the official URLs here when they are available.
const socialLinks = [
  {
    label: "LinkedIn",
    icon: Linkedin,
    href: "https://www.linkedin.com/company/procease-technologies/?viewAsMember=true",
    className: "bg-[#0A66C2] hover:bg-[#004182]",
  },
  {
    label: "Email",
    icon: Mail,
    href: "mailto:support@procease.co",
    className: "bg-emerald-600 hover:bg-emerald-700",
  },
  {
    label: "Instagram",
    icon: Instagram,
    href: "https://www.instagram.com/procease.tech/",
    className:
      "bg-gradient-to-br from-[#F9CE34] via-[#EE2A7B] to-[#6228D7] hover:brightness-90",
  },
  {
    label: "Facebook",
    icon: Facebook,
    href: "https://www.facebook.com/people/Procease/61576716486425/",
    className: "bg-[#1877F2] hover:bg-[#0d65d9]",
  },
  {
    label: "YouTube",
    icon: Youtube,
    href: "https://www.youtube.com/@Procease",
    className: "bg-[#FF0000] hover:bg-[#cc0000]",
  },
];

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
              <img
                src={logo}
                alt="HRMS Logo"
                className="h-16 w-16 mr-3 footer-logo"
              />
              {/* <h3 className="text-lg font-semibold">HRMS</h3> */}
            </div>
            <p className="text-gray-600">
              Comprehensive HR management solution for modern businesses.
            </p>
          </div>
          <div
            className="animate-slide-in-left"
            style={{ animationDelay: "0.1s" }}
          >
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link
                  to="/features"
                  className="footer-link hover:text-gray-900 transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link
                  to="/pricing"
                  className="footer-link hover:text-gray-900 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              {/* <li><a href="/security" className="footer-link hover:text-gray-900 transition-colors">Security</a></li> */}
            </ul>
          </div>
          <div
            className="animate-slide-in-right"
            style={{ animationDelay: "0.2s" }}
          >
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link
                  to="/about"
                  className="footer-link hover:text-gray-900 transition-colors"
                >
                  About Us
                </Link>
              </li>
              {/* <li><a href="/careers" className="footer-link hover:text-gray-900 transition-colors">Careers</a></li> */}
              <li>
                <Link
                  to="/contact"
                  className="footer-link hover:text-gray-900 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div
            className="animate-slide-in-right"
            style={{ animationDelay: "0.3s" }}
          >
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link
                  to="/privacy-policy"
                  className="footer-link hover:text-gray-900 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms-conditions"
                  className="footer-link hover:text-gray-900 transition-colors"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-cancellation"
                  className="footer-link hover:text-gray-900 transition-colors"
                >
                  Refund and Cancellation Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-400 mt-8 pt-8 text-center text-gray-500 footer-bottom">
          <div className="mb-5 flex flex-wrap items-center justify-center gap-3">
            {socialLinks.map(({ label, icon: Icon, href, className }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noreferrer" : undefined}
                aria-label={label}
                title={label}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
              >
                <Icon className="h-5 w-5" />
              </a>
            ))}
          </div>
          <p className="animate-pulse-hover">
            &copy; {new Date().getFullYear()} Procease HRMS. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
