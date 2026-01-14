import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Save, Upload, FileText, User } from "lucide-react";

interface EmployeeProfileData {
  // Personal Details
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  bloodGroup: string;
  maritalStatus: string;
  mobile: string;
  email: string;
  emergencyContact: string;
  emergencyPhone: string;

  // Employment
  employeeCode: string;
  dateOfJoining: string;
  employmentType: string;
  department: string;
  designation: string;
  manager: string;
  location: string;
  status: string;

  // Statutory
  aadhaar: string;
  pan: string;
  uan: string;
  esic: string;

  // Bank Details
  bankAccountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;

  // Documents
  photoUrl?: string;
  idProofUrl?: string;
  addressProofUrl?: string;
  offerLetterUrl?: string;
  certificatesUrl?: string;
  bankProofUrl?: string;
}

const mockEmployeeData: EmployeeProfileData = {
  employeeId: "EMP001",
  firstName: "John",
  lastName: "Doe",
  gender: "Male",
  dateOfBirth: "1990-05-20",
  bloodGroup: "O+",
  maritalStatus: "Married",
  mobile: "+1-234-567-8901",
  email: "john.doe@company.com",
  emergencyContact: "Jane Doe",
  emergencyPhone: "+1-234-567-8900",
  employeeCode: "JD001",
  dateOfJoining: "2022-01-15",
  employmentType: "full-time",
  department: "Engineering",
  designation: "Senior Developer",
  manager: "Sarah Smith",
  location: "New York",
  status: "active",
  aadhaar: "1234-5678-9012",
  pan: "ABCDE1234F",
  uan: "123456789012",
  esic: "10987654321",
  bankAccountHolder: "John Doe",
  bankName: "Bank of America",
  accountNumber: "123456789012",
  ifscCode: "BOFA0001234",
};

export default function EmployeeProfile() {
  const [formData, setFormData] = useState<EmployeeProfileData>(mockEmployeeData);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof EmployeeProfileData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (field: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFiles((prev) => ({
          ...prev,
          [field]: file.name,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    alert("Employee profile updated successfully!");
    setIsEditing(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-50">
              <User className="w-8 h-8 text-primary" />
              Employee Profile
            </h1>
            <p className="text-muted-foreground mt-2">Manage employee information and documents</p>
          </div>
          <Button
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
        </div>

        {/* Employee Basic Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Employee ID</Label>
                <div className="text-lg font-bold mt-1">{formData.employeeId}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <div className="text-lg font-bold mt-1">
                  {formData.firstName} {formData.lastName}
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Department</Label>
                <div className="text-lg font-bold mt-1">{formData.department}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {formData.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal">Personal</TabsTrigger>
            <TabsTrigger value="employment">Employment</TabsTrigger>
            <TabsTrigger value="statutory">Statutory</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          {/* Personal Details Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
                <CardDescription>Personal information including emergency contact</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Gender</Label>
                    <Select value={formData.gender} onValueChange={(val) => handleInputChange("gender", val)} disabled={!isEditing}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Date of Birth</Label>
                    <Input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Blood Group</Label>
                    <Select value={formData.bloodGroup} onValueChange={(val) => handleInputChange("bloodGroup", val)} disabled={!isEditing}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Marital Status</Label>
                    <Select value={formData.maritalStatus} onValueChange={(val) => handleInputChange("maritalStatus", val)} disabled={!isEditing}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Single">Single</SelectItem>
                        <SelectItem value="Married">Married</SelectItem>
                        <SelectItem value="Divorced">Divorced</SelectItem>
                        <SelectItem value="Widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Mobile Number</Label>
                    <Input
                      value={formData.mobile}
                      onChange={(e) => handleInputChange("mobile", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Emergency Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label>Contact Name</Label>
                      <Input
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                        disabled={!isEditing}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label>Contact Phone</Label>
                      <Input
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                        disabled={!isEditing}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employment Tab */}
          <TabsContent value="employment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employment Details</CardTitle>
                <CardDescription>Job-related information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Employee Code</Label>
                    <Input
                      value={formData.employeeCode}
                      onChange={(e) => handleInputChange("employeeCode", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Date of Joining</Label>
                    <Input
                      type="date"
                      value={formData.dateOfJoining}
                      onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Employment Type</Label>
                    <Select value={formData.employmentType} onValueChange={(val) => handleInputChange("employmentType", val)} disabled={!isEditing}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full-Time</SelectItem>
                        <SelectItem value="part-time">Part-Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Department</Label>
                    <Select value={formData.department} onValueChange={(val) => handleInputChange("department", val)} disabled={!isEditing}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Designation</Label>
                    <Input
                      value={formData.designation}
                      onChange={(e) => handleInputChange("designation", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Manager</Label>
                    <Input
                      value={formData.manager}
                      onChange={(e) => handleInputChange("manager", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Location</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(val) => handleInputChange("status", val)} disabled={!isEditing}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on-leave">On Leave</SelectItem>
                        <SelectItem value="terminated">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Statutory Tab */}
          <TabsContent value="statutory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statutory Details</CardTitle>
                <CardDescription>Tax and government identification numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Aadhaar Number</Label>
                    <Input
                      value={formData.aadhaar}
                      onChange={(e) => handleInputChange("aadhaar", e.target.value)}
                      disabled={!isEditing}
                      placeholder="XXXX-XXXX-XXXX"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>PAN (Permanent Account Number)</Label>
                    <Input
                      value={formData.pan}
                      onChange={(e) => handleInputChange("pan", e.target.value)}
                      disabled={!isEditing}
                      placeholder="XXXXX0000X"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>UAN (Universal Account Number)</Label>
                    <Input
                      value={formData.uan}
                      onChange={(e) => handleInputChange("uan", e.target.value)}
                      disabled={!isEditing}
                      placeholder="XXXXXXXXXXXX"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>ESIC Number</Label>
                    <Input
                      value={formData.esic}
                      onChange={(e) => handleInputChange("esic", e.target.value)}
                      disabled={!isEditing}
                      placeholder="XXXXXXXXXXXX"
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Details Tab */}
          <TabsContent value="bank" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
                <CardDescription>Banking information for salary disbursement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label>Account Holder Name</Label>
                    <Input
                      value={formData.bankAccountHolder}
                      onChange={(e) => handleInputChange("bankAccountHolder", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Bank Name</Label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) => handleInputChange("bankName", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={formData.accountNumber}
                      onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>IFSC Code</Label>
                    <Input
                      value={formData.ifscCode}
                      onChange={(e) => handleInputChange("ifscCode", e.target.value)}
                      disabled={!isEditing}
                      placeholder="XXXXX0000XXX"
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents & Uploads</CardTitle>
                <CardDescription>Upload and manage employee documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { field: "photoUrl", label: "Photo", description: "Employee profile photo" },
                  { field: "idProofUrl", label: "ID Proof", description: "Driving license or Passport" },
                  {
                    field: "addressProofUrl",
                    label: "Address Proof",
                    description: "Utility bill or rental agreement",
                  },
                  { field: "offerLetterUrl", label: "Offer Letter", description: "Original offer letter" },
                  {
                    field: "certificatesUrl",
                    label: "Educational Certificates",
                    description: "Degree and diploma certificates",
                  },
                  {
                    field: "bankProofUrl",
                    label: "Bank Account Proof",
                    description: "Bank statement or passbook",
                  },
                ].map((doc) => (
                  <div key={doc.field} className="border-b pb-6 last:border-b-0">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <Label className="text-base font-semibold">{doc.label}</Label>
                        <p className="text-sm text-muted-foreground mt-1">{doc.description}</p>
                      </div>
                      {uploadedFiles[doc.field] && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors">
                          <Upload className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">Upload File</span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => handleFileUpload(doc.field, e)}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          />
                        </label>
                        {uploadedFiles[doc.field] && (
                          <span className="text-sm text-muted-foreground">{uploadedFiles[doc.field]}</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {uploadedFiles[doc.field] ? (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            {uploadedFiles[doc.field]}
                          </div>
                        ) : (
                          <p className="text-amber-600 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            No document uploaded
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
