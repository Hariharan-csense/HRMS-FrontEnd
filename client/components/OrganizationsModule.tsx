import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Users, 
  CreditCard, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  BarChart3,
  Eye
} from "lucide-react";
import ENDPOINTS from "@/lib/endpoint";

interface OrganizationStats {
  id: string;
  name: string;
  userCount: number;
  subscriptionStatus: 'trial' | 'active' | 'none' | 'expired';
  planName: string;
  planPrice: number;
  billingCycle: string;
  startDate?: string;
  endDate?: string;
  trialEndDate?: string;
  createdAt: string;
}

interface PlanBreakdown {
  planName: string;
  price: number;
  maxUsers: number;
  billingCycle: string;
  organizationCount: number;
  trialCount: number;
  activeCount: number;
  totalUsers: number;
  organizations: {
    id: string;
    name: string;
    userCount: number;
    subscriptionStatus: 'trial' | 'active' | 'none' | 'expired';
    startDate?: string;
    endDate?: string;
    trialEndDate?: string;
  }[];
}

interface OverviewStats {
  totalOrganizations: number;
  trialOrganizations: number;
  paidOrganizations: number;
  expiredOrganizations: number;
  noSubscriptionOrganizations: number;
  totalRevenue: number;
}

const OrganizationsModule: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [planBreakdown, setPlanBreakdown] = useState<PlanBreakdown[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationStats[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchOrganizationStats();
  }, []);

  const fetchOrganizationStats = async () => {
    try {
      const response = await ENDPOINTS.getOrganizationStats();
      
      if (response.data && response.data.success) {
        const stats = response.data.data;
        setOverviewStats(stats.overview);
        setPlanBreakdown(stats.planBreakdown);
        setOrganizations(stats.organizations);
      }
    } catch (error) {
      console.error('Error fetching organization stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'none': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'trial': return <Clock className="h-4 w-4" />;
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'expired': return <XCircle className="h-4 w-4" />;
      case 'none': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    description?: string;
    colorClass?: string;
  }> = ({ title, value, icon, description, colorClass = "" }) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6 text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-white`} style={{ backgroundColor: colorClass || '#17c491' }}>
            {icon}
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {description && (
              <p className="text-xs text-gray-500 mt-2">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading organization statistics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold">Organizations Overview</h2>
          <p className="text-muted-foreground">Monitor organization subscriptions and revenue</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Eye className="h-4 w-4" />
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>

      {/* Overview Statistics */}
      {overviewStats && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Subscription Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Organizations"
              value={overviewStats.totalOrganizations}
              icon={<Building className="w-6 h-6" />}
              colorClass="#3b82f6"
            />
            <StatCard
              title="Trial Organizations"
              value={overviewStats.trialOrganizations}
              icon={<Clock className="w-6 h-6" />}
              description="Currently in trial period"
              colorClass="#f59e0b"
            />
            <StatCard
              title="Paid Organizations"
              value={overviewStats.paidOrganizations}
              icon={<CheckCircle className="w-6 h-6" />}
              description="Active paid subscriptions"
              colorClass="#10b981"
            />
            <StatCard
              title="Monthly Revenue"
              value={`₹${overviewStats.totalRevenue.toLocaleString()}`}
              icon={<DollarSign className="w-6 h-6" />}
              description="From active subscriptions"
              colorClass="#8b5cf6"
            />
          </div>
        </div>
      )}

      {/* Plan Breakdown */}
      {planBreakdown.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Plan Breakdown</h3>
          <div className="space-y-6">
            {planBreakdown.map((plan, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{plan.planName}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      {plan.billingCycle}
                    </Badge>
                  </div>
                  <CardDescription>
                    ₹{plan.price.toLocaleString()} / {plan.maxUsers} users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Plan Statistics */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{plan.organizationCount}</div>
                        <div className="text-xs text-gray-600">Total Organizations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{plan.trialCount}</div>
                        <div className="text-xs text-gray-600">Trial</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{plan.activeCount}</div>
                        <div className="text-xs text-gray-600">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{plan.totalUsers}</div>
                        <div className="text-xs text-gray-600">Total Users</div>
                      </div>
                    </div>

                    {/* Organizations List */}
                    {plan.organizations && plan.organizations.length > 0 && (
                      <div className="border-t pt-4">
                        <h4 className="font-medium text-sm text-gray-700 mb-3">Organizations ({plan.organizations.length})</h4>
                        <div className="space-y-2">
                          {plan.organizations.map((org, orgIndex) => (
                            <div key={orgIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{org.name}</span>
                                  <Badge className={getStatusColor(org.subscriptionStatus)} variant="outline">
                                    {getStatusIcon(org.subscriptionStatus)}
                                    <span className="ml-1 capitalize text-xs">{org.subscriptionStatus}</span>
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {org.userCount} users
                                  </span>
                                  {org.startDate && (
                                    <span>Started: {formatDate(org.startDate)}</span>
                                  )}
                                  {org.trialEndDate && org.subscriptionStatus === 'trial' && (
                                    <span className="text-orange-600 font-medium">
                                      Trial ends: {formatDate(org.trialEndDate)}
                                    </span>
                                  )}
                                  {org.endDate && org.subscriptionStatus === 'active' && (
                                    <span className="text-green-600 font-medium">
                                      Renews: {formatDate(org.endDate)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Organizations List */}
      {showDetails && organizations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Organization Details</h3>
          <Card>
            <CardHeader>
              <CardTitle>All Organizations ({organizations.length})</CardTitle>
              <CardDescription>Detailed view of all organizations and their subscription status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {organizations.map((org) => (
                  <div key={org.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-lg">{org.name}</h4>
                          <Badge className={getStatusColor(org.subscriptionStatus)}>
                            {getStatusIcon(org.subscriptionStatus)}
                            <span className="ml-1 capitalize">{org.subscriptionStatus}</span>
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {org.userCount} users
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-4 w-4" />
                            {org.planName}
                          </span>
                          {org.planPrice > 0 && (
                            <>
                              <span>•</span>
                              <span>₹{org.planPrice.toLocaleString()}/{org.billingCycle}</span>
                            </>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                          <span>Created: {formatDate(org.createdAt)}</span>
                          {org.startDate && (
                            <span>• Started: {formatDate(org.startDate)}</span>
                          )}
                          {org.trialEndDate && org.subscriptionStatus === 'trial' && (
                            <span className="text-orange-600 font-medium">
                              • Trial ends: {formatDate(org.trialEndDate)}
                            </span>
                          )}
                          {org.endDate && org.subscriptionStatus === 'active' && (
                            <span className="text-green-600 font-medium">
                              • Renews: {formatDate(org.endDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrganizationsModule;
