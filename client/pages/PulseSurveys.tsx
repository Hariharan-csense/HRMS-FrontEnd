import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Waves } from "lucide-react";
import { Layout } from "@/components/Layout";

const PulseSurveys: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Redirect to the first accessible submenu item based on user role
    if (user?.roles?.includes("admin")) {
      navigate("/pulse-surveys/dashboard", { replace: true });
    } else {
      navigate("/pulse-surveys/overview", { replace: true });
    }
  }, [navigate, user]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl text-center flex items-center justify-center gap-2">
            <Waves className="w-6 h-6 text-blue-600" />
            Loading Pulse Surveys...
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-gray-600">Redirecting to the appropriate page...</p>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
};

export default PulseSurveys;
