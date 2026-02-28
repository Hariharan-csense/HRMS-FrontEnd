import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Briefcase, Calendar, User, Lock, Camera, AlertTriangle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { profileHelper, ProfileData, PasswordData } from "@/components/helper/profile/profile";
import { handleChangePassword as handleChangePasswordHelper } from "@/components/helper/login/login";
import { activityHelper, ActivityData } from "@/components/helper/activity/activity";
import { documentHelper, DocumentData } from "@/components/helper/document/document";
import { BASE_URL } from "@/lib/endpoint";
import { isValidPhone } from "@/lib/validation";

export default function UserProfile() {
  const { user, setUser, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [documents, setDocuments] = useState<DocumentData[]>([]);
  const [formData, setFormData] = useState({
    first_name: user?.name || "",
    last_name: "",
    mobile: "+91 98765 43210",
    employee_id: "", // Add employee_id to state
    company_id: "", // Add company_id to state
    department_id: "",
    designation_id: "",
    department_name: "",
    designation_name: "",
    location: "",
    status: "",
    joined_date: "",
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const resolveProfilePhotoUrl = (photoPath?: string | null) => {
    if (!photoPath) return "";
    if (photoPath.startsWith("http://") || photoPath.startsWith("https://") || photoPath.startsWith("data:")) {
      return photoPath;
    }
    try {
      return new URL(photoPath, BASE_URL).toString();
    } catch {
      const normalizedPath = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
      return `${BASE_URL}${normalizedPath}`;
    }
  };

  // Update avatarPreview when user context changes
  useEffect(() => {
    if (user?.avatar) {
      setAvatarPreview(user.avatar);
    }
  }, [user?.avatar]);

  // Load profile data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const profileResponse = await profileHelper.getProfile();
        const profileData = profileResponse.data || profileResponse;
        
        setFormData({
          first_name: profileData.first_name || user?.name || "",
          last_name: profileData.last_name || "",
          mobile: profileData.mobile || "+91 98765 43210",
          employee_id: profileData.employee_id || "", // Add employee_id from API
          company_id: profileData.company_id || "", // Add company_id from API
          department_id: profileData.department_id || "",
          designation_id: profileData.designation_id || "",
          department_name: profileData.department_name || "",
          designation_name: profileData.designation_name || "",
          location: profileData.location_office || "",
          status: profileData.status || "",
          joined_date: profileData.doj ? new Date(profileData.doj).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : (profileData.created_at ? new Date(profileData.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : ""),
        });

        const profileImageUrl = resolveProfilePhotoUrl(profileData.profile_photo) || user?.avatar || "";
        setAvatarPreview(profileImageUrl);
        
        // Always update user context with profile data from API
        const newName = profileData.first_name ? `${profileData.first_name} ${profileData.last_name || ''}`.trim() : user?.name;
        const newAvatar = profileImageUrl;
        
        // Update user context with latest profile data
        const updatedUser = {
          ...user,
          name: newName,
          avatar: newAvatar,
        };
        
        setUser(updatedUser);
      } catch (error) {
        // Error handling without console.log
      }
    };

    const loadActivities = async () => {
      try {
        const activitiesData = await activityHelper.getActivities();
        setActivities(activitiesData);
      } catch (error) {
        // Error handling without console.log
      }
    };

    const loadDocuments = async () => {
      try {
        const documentsData = await documentHelper.getDocuments();
        setDocuments(documentsData);
      } catch (error) {
        // Error handling without console.log
      }
    };

    if (user) {
      loadProfileData();
      loadActivities();
      loadDocuments();
    }
  }, [user?.id, setUser]);

  if (!user) {
    return null;
  }

  const canDeleteOrganizationAccount =
    user.type?.toLowerCase() === "admin" &&
    !user.roles?.some((r) => r?.toLowerCase() === "superadmin");

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!isValidPhone(formData.mobile)) {
      toast.error("Phone number must be 10 digits and start with 6, 7, 8, or 9");
      return;
    }

    setIsLoading(true);
    try {
      const profileData: ProfileData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        mobile: formData.mobile,
        department_id: formData.department_id,
        designation_id: formData.designation_id,
      };
      
      const updatedProfileResponse = await profileHelper.updateProfile(profileData);
      const updatedProfile = updatedProfileResponse.data || updatedProfileResponse;
      
      // Update user context with new data
      setUser({
        ...user,
        name: updatedProfile.first_name ? `${updatedProfile.first_name} ${updatedProfile.last_name || ''}`.trim() : formData.first_name,
      });

      // Log activity
      await activityHelper.logActivity("Updated Profile");
      
      // Refresh activities
      const activitiesData = await activityHelper.getActivities();
      setActivities(activitiesData);
      
      setIsEditing(false);
    } catch (error) {
      // Error is already handled by the helper function
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setIsLoading(true);
    try {
      const result = await handleChangePasswordHelper({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      });

      if (result.success) {
        toast.success(result.message);
        setShowPasswordDialog(false);
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

        // Log activity
        await activityHelper.logActivity("Changed Password");
        
        // Refresh activities
        const activitiesData = await activityHelper.getActivities();
        setActivities(activitiesData);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    
    try {
      // Read file and create preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        setAvatarPreview(result);

        try {
          // Upload avatar using helper function
          const updatedProfileResponse = await profileHelper.updateAvatar(file);
          const updatedProfile = updatedProfileResponse.data || updatedProfileResponse;
          
          // Update user context with new avatar
          setUser({
            ...user,
            avatar: resolveProfilePhotoUrl(updatedProfile.profile_photo) || result,
          });

          // Log activity
          await activityHelper.logActivity("Updated Profile Picture");
          
          // Refresh activities
          const activitiesData = await activityHelper.getActivities();
          setActivities(activitiesData);
        } catch (uploadError) {
          // Reset avatar preview on error
          setAvatarPreview(user?.avatar || "");
        } finally {
          setIsUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingAvatar(false);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDeleteOrganizationAccount = async () => {
    if (deleteConfirmation.trim().toUpperCase() !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setIsDeletingAccount(true);
    try {
      await profileHelper.deleteMyAccount("DELETE");
      setIsDeleteDialogOpen(false);
      setDeleteConfirmation("");
      await logout();
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Profile</h1>
            <p className="text-muted-foreground mt-2">View and manage your account information</p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            )}
            {canDeleteOrganizationAccount && !isEditing && (
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[520px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Delete Admin Account
                    </DialogTitle>
                    <DialogDescription>
                      This will permanently delete your organization and all related data. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <Label htmlFor="delete-confirmation">
                      Type <span className="font-semibold">DELETE</span> to confirm
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="DELETE"
                    />
                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsDeleteDialogOpen(false);
                          setDeleteConfirmation("");
                        }}
                        disabled={isDeletingAccount}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteOrganizationAccount}
                        disabled={isDeletingAccount || deleteConfirmation.trim().toUpperCase() !== "DELETE"}
                      >
                        {isDeletingAccount ? "Deleting..." : "Delete Permanently"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={avatarPreview || user.avatar} alt={user.name} />
                    <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 bg-primary hover:bg-primary/90 disabled:bg-gray-400 text-white rounded-full p-2 shadow-lg transition-colors"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-2xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{user.roles[0]}</p>
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="font-medium">{formData.mobile || "+91 98765 43210"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-medium">{formData.location || "Not specified"}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="font-medium">{formData.department_name || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Joined Date</p>
                      <p className="font-medium">{formData.joined_date || "Not specified"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{formData.status || "Unknown"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Tabs */}
        <Tabs defaultValue="about" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Your account details and preferences</CardDescription>
                  </div>
                  {!isEditing && (
                    <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Lock className="w-4 h-4" />
                          Change Password
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                          <DialogTitle>Change Password</DialogTitle>
                          <DialogDescription>
                            Enter your current password and a new password
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                              id="current-password"
                              type="password"
                              placeholder="Enter current password"
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                              id="new-password"
                              type="password"
                              placeholder="Enter new password"
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Confirm new password"
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            />
                          </div>
                          <Button onClick={handleChangePassword} className="w-full" disabled={isLoading}>
                            {isLoading ? "Updating..." : "Update Password"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">First Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.first_name}
                        onChange={(e) => handleFieldChange("first_name", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{formData.first_name}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Last Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.last_name}
                        onChange={(e) => handleFieldChange("last_name", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{formData.last_name}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email Address</Label>
                    <p className="text-lg font-medium mt-1">{user.email}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Employee ID</Label>
                    <p className="text-lg font-medium mt-1">{formData.employee_id || "Not assigned"}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                    <p className="text-lg font-medium mt-1 capitalize">{user.roles[0]}</p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                    {isEditing ? (
                      <Input
                        value={formData.department_id}
                        onChange={(e) => handleFieldChange("department_id", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{formData.department_name || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Designation</Label>
                    {isEditing ? (
                      <Input
                        value={formData.designation_id}
                        onChange={(e) => handleFieldChange("designation_id", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{formData.designation_name || 'Not specified'}</p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        type="tel"
                        inputMode="numeric"
                        maxLength={10}
                        value={formData.mobile}
                        onChange={(e) => handleFieldChange("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-lg font-medium mt-1">{formData.mobile}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your recent actions and login history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {activities.length > 0 ? (
                    activities.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start p-4 rounded-lg border">
                        <div>
                          <p className="font-medium">{item.action}</p>
                          <p className="text-sm text-muted-foreground">{item.location}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {item.timestamp ? activityHelper.formatDate(item.timestamp) : item.date}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>Your uploaded documents and certifications</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{documentHelper.getFileIcon(doc.original_name || doc.filename)}</span>
                          <div>
                            <p className="font-medium">{doc.original_name || doc.filename}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.type} • {documentHelper.formatDate(doc.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => documentHelper.viewDocument(doc.id, doc.filename)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => documentHelper.downloadDocument(doc.id, doc.original_name, doc.filename)}
                          >
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No documents uploaded yet</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Documents uploaded by HR will appear here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
