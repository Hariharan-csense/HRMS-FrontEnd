// Asset types and mock data
export type AssetStatus = "active" | "inactive" | "maintenance" | "damaged" | "disposed";
export type AssetType = "laptop" | "desktop" | "phone" | "monitor" | "furniture" | "vehicle" | "other";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  serial: string;
  assignedTo?: string;
  assignedEmployee?: string;
  issueDate?: string;
  returnDate?: string;
  status: AssetStatus;
  location?: string;
  value?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock assets data
export const mockAssets: Asset[] = [
  {
    id: "AST001",
    name: "Dell XPS 13",
    type: "laptop",
    serial: "DL-XPS-2024-001",
    assignedEmployee: "John Doe",
    issueDate: "2024-01-15",
    status: "active",
    location: "Engineering - Desk 1",
    value: 1200,
    description: "High-performance laptop for development",
    createdAt: "2024-01-15",
    updatedAt: "2024-01-15",
  },
  {
    id: "AST002",
    name: "MacBook Pro 16",
    type: "laptop",
    serial: "MB-PRO-2024-001",
    assignedEmployee: "Sarah Smith",
    issueDate: "2024-02-01",
    status: "active",
    location: "Design - Desk 5",
    value: 2400,
    description: "Professional design workstation",
    createdAt: "2024-02-01",
    updatedAt: "2024-02-01",
  },
  {
    id: "AST003",
    name: "Dell Monitor 27",
    type: "monitor",
    serial: "DL-MON-2024-001",
    assignedEmployee: "Michael Johnson",
    issueDate: "2024-01-20",
    status: "active",
    location: "Engineering - Desk 2",
    value: 350,
    description: "4K Display Monitor",
    createdAt: "2024-01-20",
    updatedAt: "2024-01-20",
  },
  {
    id: "AST004",
    name: "iPhone 15 Pro",
    type: "phone",
    serial: "IP-15-2024-001",
    assignedEmployee: "Emma Wilson",
    issueDate: "2024-03-01",
    status: "active",
    location: "Sales - Mobile",
    value: 1100,
    description: "Company mobile device",
    createdAt: "2024-03-01",
    updatedAt: "2024-03-01",
  },
  {
    id: "AST005",
    name: "Office Desk",
    type: "furniture",
    serial: "FUR-DSK-2024-001",
    assignedEmployee: "David Brown",
    issueDate: "2024-01-10",
    status: "active",
    location: "Office - HR Department",
    value: 400,
    description: "Standard office desk",
    createdAt: "2024-01-10",
    updatedAt: "2024-01-10",
  },
  {
    id: "AST006",
    name: "Conference Room Projector",
    type: "other",
    serial: "PROJ-2024-001",
    status: "maintenance",
    location: "Conference Room A",
    value: 800,
    description: "HD Projector for presentations",
    createdAt: "2024-01-05",
    updatedAt: "2024-03-15",
  },
];

// Helper functions
export const getAssetTypeLabel = (type: AssetType): string => {
  const labels: Record<AssetType, string> = {
    laptop: "Laptop",
    desktop: "Desktop",
    phone: "Phone",
    monitor: "Monitor",
    furniture: "Furniture",
    vehicle: "Vehicle",
    other: "Other",
  };
  return labels[type];
};

export const getStatusLabel = (status: AssetStatus): string => {
  const labels: Record<AssetStatus, string> = {
    active: "Active",
    inactive: "Inactive",
    maintenance: "Maintenance",
    damaged: "Damaged",
    disposed: "Disposed",
  };
  return labels[status];
};

export const getStatusColor = (
  status: AssetStatus
): "success" | "warning" | "error" | "default" => {
  const colors: Record<AssetStatus, "success" | "warning" | "error" | "default"> = {
    active: "success",
    inactive: "default",
    maintenance: "warning",
    damaged: "error",
    disposed: "error",
  };
  return colors[status];
};
