// Employee types and mock data
export type EmploymentType = "full-time" | "part-time" | "contract" | "intern";
export type EmployeeStatus = "active" | "inactive" | "on-leave" | "terminated";

export const mockEmployees = [
  {
    id: "EMP001",
    employeeId: "EMP001",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+919876543210",
    dateOfBirth: "1990-05-15",
    gender: "Male",
    bloodGroup: "B+",
    maritalStatus: "Married",
    emergencyContact: "Jane Doe",
    emergencyPhone: "+919876543211",
    departmentId: "DEPT001",
    designationId: "DESG001",
    department: "Engineering",
    designation: "Senior Software Engineer",
    dateOfJoining: "2020-01-15",
    employmentType: "full-time",
    status: "active",
    role: "employee",
    location: "Bangalore",
    aadhaar: "123456789012",
    pan: "ABCDE1234F",
    uan: "123456789012",
    esic: "123456789012345",
    bankAccountHolder: "John Doe",
    bankName: "HDFC Bank",
    accountNumber: "12345678901234",
    ifscCode: "HDFC0001234",
    salary: 85000,
    photoUrl: "",
    idProofUrl: "",
    addressProofUrl: "",
    offerLetterUrl: "",
    certificatesUrl: "",
    bankProofUrl: ""
  },
  {
    id: "EMP002",
    employeeId: "EMP002",
    firstName: "Sarah",
    lastName: "Smith",
    email: "sarah.smith@example.com",
    phone: "+919876543212",
    dateOfBirth: "1992-08-21",
    gender: "Female",
    bloodGroup: "A+",
    maritalStatus: "Single",
    emergencyContact: "Mike Smith",
    emergencyPhone: "+919876543213",
    departmentId: "DEPT002",
    designationId: "DESG002",
    department: "HR",
    designation: "HR Manager",
    dateOfJoining: "2019-11-10",
    employmentType: "full-time",
    status: "active",
    role: "hr",
    location: "Bangalore",
    aadhaar: "987654321098",
    pan: "ZYXWV9876A",
    uan: "987654321098",
    esic: "987654321098765",
    bankAccountHolder: "Sarah Smith",
    bankName: "ICICI Bank",
    accountNumber: "98765432109876",
    ifscCode: "ICIC0001987",
    salary: 95000,
    photoUrl: "",
    idProofUrl: "",
    addressProofUrl: "",
    offerLetterUrl: "",
    certificatesUrl: "",
    bankProofUrl: ""
  }
];

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  maritalStatus: string;

  emergencyContact: string;
  emergencyPhone: string;

  // ✅ BOTH IDs and names for flexibility
  departmentId: string;
  designationId: string;
  department: string;
  designation: string;

  dateOfJoining: string;
  employmentType: "full-time" | "part-time" | "contract" | "intern";
  status: "active" | "inactive" | "on-leave" | "terminated";
  shift?: string;

  role: string;
  location: string;

  aadhaar: string;
  pan: string;
  uan: string;
  esic: string;

  bankAccountHolder: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;

  photoUrl: string;
  idProofUrl: string;
  addressProofUrl: string;
  offerLetterUrl: string;
  certificatesUrl: string;
  bankProofUrl: string;
  
  createdAt?: string;
  updatedAt?: string;
};




export const getEmploymentTypeLabel = (type: EmploymentType): string => {
  const labels: Record<EmploymentType, string> = {
    "full-time": "Full-Time",
    "part-time": "Part-Time",
    contract: "Contract",
    intern: "Intern",
  };
  return labels[type];
};

export const getStatusLabel = (status: EmployeeStatus): string => {
  const labels: Record<EmployeeStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    "on-leave": "On Leave",
    terminated: "Terminated",
  };
  return labels[status];
};

export const getStatusBadgeClass = (status: EmployeeStatus) => {
  const classes: Record<EmployeeStatus, string> = {
    active: "bg-green-100 text-green-800 border-green-200",
    inactive: "bg-gray-100 text-gray-800 border-gray-200",
    "on-leave": "bg-yellow-100 text-yellow-800 border-yellow-200",
    terminated: "bg-red-100 text-red-800 border-red-200",
  };
  return classes[status];
};
