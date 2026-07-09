import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

interface KPIComingSoonProps {
  title: string;
}

const KPIComingSoon: React.FC<KPIComingSoonProps> = ({ title }) => {
  return (
    <Layout>
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-md border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                {title}
              </h1>
              <p className="mt-2 text-lg font-medium text-muted-foreground">
                Coming Soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default KPIComingSoon;
