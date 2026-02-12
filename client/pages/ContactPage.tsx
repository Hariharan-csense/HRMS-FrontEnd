import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, MessageSquare } from "lucide-react";
import { showToast } from "@/utils/toast";
import Footer from "@/components/Footer";
import logo from "../assets/logo.png";

const ContactPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          company: formData.company.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          from_name: "HRMS Contact Form",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFormData({
          name: "",
          email: "",
          company: "",
          subject: "",
          message: ""
        });
        showToast.success("Thank you for your message! We'll get back to you soon.");
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

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Us",
      details: ["support@procease.co ", ""],
      description: "We'll respond within 24 hours"
    },
    {
      icon: Phone,
      title: "Call Us",
      details: ["91 9042894918", ""],
      description: "Mon-Fri 9.30 AM-6 PM IST"
    },
    {
      icon: MapPin,
      title: "Visit Us",
      details: ["First Floor, Osian Chloroplaza, 106, Link Road,", "Gandhi Nagar, Porur, Chennai, Tamil Nadu 600116"],
      description: "Schedule a meeting in advance"
    }
  ];

  const faqs = [
    {
      question: "What industries do you serve?",
      answer: "We serve businesses across all industries including technology, healthcare, manufacturing, retail, and professional services."
    },
    {
      question: "Do you offer custom solutions?",
      answer: "Yes, we offer customizable solutions tailored to your specific business needs and requirements."
    },
    {
      question: "What is your implementation timeline?",
      answer: "Typical implementation takes 2-4 weeks depending on the complexity and customization requirements."
    },
    {
      question: "Do you provide training and support?",
      answer: "Yes, we provide comprehensive onboarding training and 24/7 customer support to ensure your success."
    }
  ];

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
              <a href="/" className="text-gray-700 hover:text-gray-900 transition-colors">Home</a>
              <a href="/features" className="text-gray-700 hover:text-gray-900 transition-colors">Features</a>
              <a href="/pricing" className="text-gray-700 hover:text-gray-900 transition-colors">Pricing</a>
              <a href="/about" className="text-gray-700 hover:text-gray-900 transition-colors">About</a>
              <a href="/contact" className="text-green-600 font-medium hover:text-green-700 transition-colors">Contact</a>
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
            Get in Touch
          </h1>
          <p className="text-xl text-green-100 mb-8">
            We're here to help you transform your HR operations. Reach out to us anytime.
          </p>
        </div>
      </section>

      {/* Contact Info Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {contactInfo.map((info, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <info.icon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{info.title}</h3>
                  <div className="space-y-2 mb-3">
                    {info.details.map((detail, detailIndex) => (
                      <p key={detailIndex} className="text-gray-700 font-medium">{detail}</p>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">{info.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Office Hours */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Send Us a Message</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    name="company"
                    type="text"
                    value={formData.company}
                    onChange={handleInputChange}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    type="text"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    placeholder="How can we help you?"
                  />
                </div>
                <div>
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    placeholder="Tell us more about your needs..."
                  />
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
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

            {/* Office Hours & FAQ */}
            <div>
              <div className="mb-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Office Hours</h3>
                <Card className="p-6">
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium">Monday - Friday</p>
                          <p className="text-gray-600">9:30 AM - 6:00 PM IST</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium">Saturday</p>
                          <p className="text-gray-600">9:30 AM - 5:00 PM IST</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-green-600 mr-3" />
                        <div>
                          <p className="font-medium">Sunday</p>
                          <p className="text-gray-600">Closed</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <Card key={index} className="p-4">
                      <CardContent className="pt-0">
                        <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                        <p className="text-gray-600 text-sm">{faq.answer}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Support */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <MessageSquare className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Immediate Help?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Start a live chat with our support team for instant assistance
          </p>
          <Button size="lg" className="bg-green-600 hover:bg-green-700">
            Start Live Chat
            <MessageSquare className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-green-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your HR Operations?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Get in touch with our team to learn how HRMS can help your business grow
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate("/login")}
            >
              Start Free Trial
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-green-600"
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

export default ContactPage;
