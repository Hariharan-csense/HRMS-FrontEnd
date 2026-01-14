import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-2">{description}</p>
          )}
        </div>

        <Card className="border-dashed">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <CardTitle>Feature Coming Soon</CardTitle>
                <CardDescription>
                  This page is being developed
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The "{title}" module is currently under development. 
              We're working on building this feature to provide you with a complete HRMS experience.
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/dashboard")}>
                Back to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate(-1)}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Development Roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Development Roadmap</CardTitle>
            <CardDescription>
              These modules will be available soon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Employee profile forms with comprehensive data fields",
                "Attendance capture with facial recognition simulation and geolocation",
                "Leave application and approval workflows",
                "Payroll processing and payslip generation",
                "Expense claim management and approvals",
                "Asset allocation and tracking",
                "Exit and offboarding checklists",
                "Comprehensive reports and analytics",
                "Data tables with search, filter, and export capabilities",
                "Audit trails for compliance and tracking",
              ].map((item, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="text-primary font-bold">✓</span>
                  <span className="text-sm text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
