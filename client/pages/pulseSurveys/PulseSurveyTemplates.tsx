import React, { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import ENDPOINTS from "@/lib/endpoint";
import { useAuth } from "@/context/AuthContext";
import { FileText, Plus, Edit, Trash2, Settings, Calendar, Tag, CheckCircle, XCircle, Shield } from "lucide-react";

type Template = {
  id: number;
  name: string;
  title: string;
  message: string;
  category: string;
  isActive: boolean;
  createdAt: string;
};

const PulseSurveyTemplates: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = useMemo(
    () => user?.roles?.some((r) => r?.toLowerCase() === "admin"),
    [user?.roles],
  );

  const [rows, setRows] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTitle("");
    setMessage("");
    setCategory("general");
    setIsActive(true);
  };

  const fetchRows = async () => {
    const res = await ENDPOINTS.getPulseSurveyTemplates();
    setRows(Array.isArray(res.data) ? res.data : []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetchRows();
      } catch (e: any) {
        if (!cancelled) {
          toast({
            title: "Failed",
            description:
              e?.response?.data?.message || e?.message || "Failed to load templates",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onEdit = (t: Template) => {
    setEditingId(t.id);
    setName(t.name);
    setTitle(t.title);
    setMessage(t.message || "");
    setCategory(t.category || "general");
    setIsActive(Boolean(t.isActive));
  };

  const onSave = async () => {
    const n = name.trim();
    const t = title.trim();
    if (!n) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }
    if (!t) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await ENDPOINTS.updatePulseSurveyTemplate(editingId, {
          name: n,
          title: t,
          message,
          category,
          isActive,
        });
        toast({ title: "Updated", description: "Template updated." });
      } else {
        await ENDPOINTS.createPulseSurveyTemplate({
          name: n,
          title: t,
          message,
          category,
          isActive,
        });
        toast({ title: "Created", description: "Template created." });
      }
      await fetchRows();
      resetForm();
    } catch (e: any) {
      toast({
        title: "Failed",
        description:
          e?.response?.data?.message || e?.message || "Failed to save template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: number) => {
    setSaving(true);
    try {
      await ENDPOINTS.deletePulseSurveyTemplate(id);
      await fetchRows();
      toast({ title: "Deleted", description: "Template deleted." });
      if (editingId === id) resetForm();
    } catch (e: any) {
      toast({
        title: "Failed",
        description:
          e?.response?.data?.message || e?.message || "Failed to delete template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md">
            <div className="p-4 bg-red-100 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <Shield className="h-10 w-10 text-red-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">Access Restricted</h2>
              <p className="text-gray-500">This page is available only for administrators.</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="text-sm text-red-700">
                You need admin privileges to manage survey templates.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="max-w-7xl mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Survey Templates Manager
              </h1>
            </div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create and manage reusable survey templates for quick pulse surveys deployment
            </p>
          </div>

          {/* Create/Edit Template Form */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Settings className="h-5 w-5" />
                {editingId ? "Edit Template" : "Create New Template"}
              </CardTitle>
              <CardDescription className="text-emerald-100">
                Templates are stored per organization and can be reused for multiple surveys
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Template Name</Label>
                  <Input 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Daily Happiness Check" 
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Category</Label>
                  <Input 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)} 
                    placeholder="general" 
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Survey Title</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="How are you feeling today?" 
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Message Template</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={"How happy are you at work today? (Rate 1-10)\n\nWhat could make your workday better?\nShare any suggestions or concerns..."}
                  className="min-h-[140px] border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={isActive} 
                    onCheckedChange={setIsActive}
                    className="data-[state=checked]:bg-emerald-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Template Status</span>
                    <p className="text-xs text-gray-500">
                      {isActive ? "Template is active and available for use" : "Template is disabled"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {editingId ? (
                    <Button 
                      variant="outline" 
                      onClick={resetForm} 
                      disabled={saving}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  ) : null}
                  <Button 
                    onClick={onSave} 
                    disabled={saving}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 shadow-md hover:shadow-lg transition-all"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingId ? (
                          <>
                            <Edit className="h-4 w-4 mr-2" />
                            Update Template
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Template
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-xl">
                <FileText className="h-5 w-5" />
                Existing Templates
              </CardTitle>
              <CardDescription className="text-teal-100">
                {loading ? "Loading templates..." : `Managing ${rows.length} template${rows.length === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
                  <p className="text-gray-500">Loading survey templates...</p>
                </div>
              ) : rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <div className="p-4 bg-gray-100 rounded-full">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Templates Yet</h3>
                    <p className="text-gray-500">Create your first survey template to get started</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {rows.map((t, index) => (
                    <Card 
                      key={t.id} 
                      className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 ${
                        index % 2 === 0 
                          ? 'bg-gradient-to-r from-emerald-50 to-teal-50' 
                          : 'bg-gradient-to-r from-teal-50 to-cyan-50'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                          {/* Template Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-3 mb-4">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <FileText className="h-5 w-5 text-emerald-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-gray-900 truncate">{t.name}</h3>
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                  <Badge className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 border-0">
                                    <Tag className="h-3 w-3 mr-1" />
                                    {t.category || "general"}
                                  </Badge>
                                  {t.isActive ? (
                                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100 mb-4">
                              <p className="text-sm font-medium text-gray-700 mb-1">Survey Title:</p>
                              <p className="text-gray-900">{t.title}</p>
                            </div>

                            {t.message ? (
                              <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100 mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Message Template:</p>
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                                  {t.message}
                                </p>
                              </div>
                            ) : null}

                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>Created {new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-3 min-w-fit">
                            <Button
                              variant="outline"
                              onClick={() => onEdit(t)}
                              disabled={saving}
                              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => onDelete(t.id)}
                              disabled={saving}
                              className="border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PulseSurveyTemplates;

