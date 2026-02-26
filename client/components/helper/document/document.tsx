import { toast } from "sonner";
import ENDPOINTS from "@/lib/endpoint";

export interface DocumentData {
  id: string;
  type: string;
  file_path: string;
  original_name: string | null;
  filename: string;
  created_at: string;
}

export const documentHelper = {
  // Get employee documents
  getDocuments: async (): Promise<DocumentData[]> => {
    try {
      console.log('DOCUMENT HELPER - Fetching documents...');
      const response = await ENDPOINTS.getDocuments();
      console.log('DOCUMENT HELPER - Documents response:', response);
      
      if (response.data && response.data.success) {
        console.log('DOCUMENT HELPER - Documents loaded successfully:', {
          count: response.data.data?.length || 0,
          documents: response.data.data
        });
        return response.data.data || [];
      } else {
        console.error('DOCUMENT HELPER - Documents fetch failed:', response.data);
        toast.error(response.data?.message || "Failed to fetch documents");
        return [];
      }
    } catch (error: any) {
      console.error("DOCUMENT HELPER - Error fetching documents:", error);
      
      // Enhanced error handling for cross-company access issues
      if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to access these documents.");
      } else if (error.response?.status === 404) {
        toast.error("Documents not found. You may not have access to this organization's data.");
      } else {
        toast.error(error.response?.data?.message || "Failed to fetch documents");
      }
      return [];
    }
  },

  // Download document
  downloadDocument: async (id: string, originalName: string | null, filename: string) => {
    try {
      console.log('DOCUMENT HELPER - Downloading document:', { id, originalName, filename });
      const response = await ENDPOINTS.downloadDocument(id);
      
      console.log('DOCUMENT HELPER - Download response:', response);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      // Use filename if original_name is null
      const downloadName = originalName || filename;
      
      // Create temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up URL
      window.URL.revokeObjectURL(url);
      
      toast.success("Document downloaded successfully");
    } catch (error: any) {
      console.error("DOCUMENT HELPER - Error downloading document:", error);
      
      // Enhanced error handling for cross-company access issues
      if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to download this document.");
      } else if (error.response?.status === 404) {
        toast.error("Document not found. You may not have access to this organization's data.");
      } else {
        toast.error(error.response?.data?.message || "Failed to download document");
      }
    }
  },

  // View document in browser
  viewDocument: async (id: string, filename: string) => {
    try {
      console.log('DOCUMENT HELPER - Viewing document:', { id, filename });
      const response = await ENDPOINTS.downloadDocument(id);
      
      console.log('DOCUMENT HELPER - View response:', response);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: response.headers?.['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        toast.error("Popup blocked. Please allow popups for this site.");
      } else {
        toast.success("Document opened in new tab");
      }
      
      // Clean up URL after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 1000);
    } catch (error: any) {
      console.error("DOCUMENT HELPER - Error viewing document:", error);
      
      // Enhanced error handling for cross-company access issues
      if (error.response?.status === 403) {
        toast.error("Access denied. You don't have permission to view this document.");
      } else if (error.response?.status === 404) {
        toast.error("Document not found. You may not have access to this organization's data.");
      } else {
        toast.error(error.response?.data?.message || "Failed to view document");
      }
    }
  },

  // Get file type icon
  getFileIcon: (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'txt':
        return '📃';
      default:
        return '📁';
    }
  },

  // Format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  // Format date
  formatDate: (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
};
