import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Send, MessageSquare } from "lucide-react";
import { showToast } from "@/utils/toast";

interface ContactPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactPopup: React.FC<ContactPopupProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Validate form data
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      showToast.error("Please fill in all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      // Send email via Web3Forms
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_key: "878f76fa-32d6-4ba7-8505-d8944891de11",
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          organization: formData.organization.trim(),
          message: formData.message.trim(),
          from_name: "HRMS Contact Popup",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: "",
          email: "",
          phone: "",
          organization: "",
          message: ""
        });
        showToast.success("Thank you for your message! We'll get back to you soon.");
        onClose();
      } else {
        showToast.error("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      showToast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      // Trigger animation after a small delay
      setTimeout(() => setIsAnimating(true), 50);
    } else {
      setIsAnimating(false);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with fade animation */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-all duration-300"
        style={{
          opacity: isOpen ? 1 : 0,
        }}
        onClick={onClose}
      />
      
      {/* Popup card with scale and slide animation */}
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-md w-full transform transition-all duration-500 ease-out"
        style={{
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating 
            ? 'scale(1) translateY(0) translateX(0)' 
            : 'scale(0.7) translateY(20px) translateX(0)',
        }}
      >
        {/* Header */}
        <div className="bg-white text-gray-800 px-6 py-4 rounded-t-lg flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-3">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold">Send Us a Message</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 p-2"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Full Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="John Doe"
              className="border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              placeholder="john@example.com"
              className="border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="+91 93609 55005"
              className="border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organization" className="text-sm font-medium text-gray-700">Organization</Label>
            <Input
              id="organization"
              name="organization"
              type="text"
              value={formData.organization}
              onChange={handleInputChange}
              placeholder="Acme Corporation"
              className="border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message" className="text-sm font-medium text-gray-700">Message *</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={4}
              placeholder="Tell us how we can help you..."
              className="border-gray-200 focus:border-green-500 focus:ring-green-500 transition-all duration-200 resize-none"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Sending...
              </>
            ) : (
              <>
                Send Message
                <Send className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ContactPopup;
