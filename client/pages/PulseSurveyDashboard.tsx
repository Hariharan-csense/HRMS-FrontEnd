import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves } from "lucide-react";
import { Layout } from "@/components/Layout";

const PulseSurveyDashboard: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pulse Survey Dashboard</h1>
          <p className="text-gray-600">Admin-only survey management dashboard</p>
        </div>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-center">Coming Soon</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">
              This feature is currently under development. The Pulse Survey Dashboard will provide:
            </p>
            <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto">
              <li>• Real-time survey participation metrics</li>
              <li>• Employee engagement analytics</li>
              <li>• Response rate tracking</li>
              <li>• Trend analysis and insights</li>
              <li>• Department-wise comparisons</li>
            </ul>
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Expected Release:</strong> Q1 2026
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </Layout>
  );
};

export default PulseSurveyDashboard;
