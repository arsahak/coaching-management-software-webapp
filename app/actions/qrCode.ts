"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface QRCodeData {
  name: string;
  type: "student" | "exam" | "admission" | "custom" | "url" | "text";
  content: string;
  description?: string;
  studentId?: string;
  admissionId?: string;
  examId?: string;
  expiresAt?: string;
  isActive?: boolean;
  metadata?: Record<string, unknown>;
}

export interface QRCodeResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Helper function to get auth headers
async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const token = session?.accessToken;

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// Create QR code
export async function createQRCode(
  qrData: QRCodeData
): Promise<QRCodeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/qrcode`, {
      method: "POST",
      headers,
      body: JSON.stringify(qrData),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found or server error. Status: ${response.status}. Please ensure the backend QR code API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create QR code",
      };
    }

    return {
      success: true,
      message: data.message || "QR code created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Create QR code error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating QR code",
    };
  }
}

// Get QR codes
export async function getQRCodes(
  page: number = 1,
  limit: number = 50,
  filters?: {
    type?: string;
    studentId?: string;
    admissionId?: string;
    examId?: string;
    isActive?: boolean;
    search?: string;
  }
): Promise<QRCodeResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.studentId && { studentId: filters.studentId }),
      ...(filters?.admissionId && { admissionId: filters.admissionId }),
      ...(filters?.examId && { examId: filters.examId }),
      ...(filters?.isActive !== undefined && {
        isActive: filters.isActive.toString(),
      }),
      ...(filters?.search && { search: filters.search }),
    });

    const response = await fetch(`${API_URL}/api/qrcode?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Check if response is ok before parsing
    if (!response.ok) {
      // Handle network errors (500) or authentication errors (401)
      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({
          error: "Network error or server unavailable",
        }));
        return {
          success: false,
          error:
            errorData.error ||
            errorData.message ||
            "Failed to connect to server",
        };
      }

      // Handle 401 errors (invalid/expired token)
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({
          error: "Invalid or expired token",
        }));
        return {
          success: false,
          error:
            errorData.error ||
            errorData.message ||
            "Invalid or expired token. Please log in again.",
        };
      }
    }

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend QR code API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch QR codes",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Get QR codes error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching QR codes",
    };
  }
}

// Get single QR code by ID
export async function getQRCodeById(id: string): Promise<QRCodeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/qrcode/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend QR code API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch QR code",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get QR code by ID error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching QR code",
    };
  }
}

// Update QR code
export async function updateQRCode(
  id: string,
  qrData: Partial<QRCodeData>
): Promise<QRCodeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/qrcode/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(qrData),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend QR code API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update QR code",
      };
    }

    return {
      success: true,
      message: data.message || "QR code updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Update QR code error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while updating QR code",
    };
  }
}

// Delete QR code
export async function deleteQRCode(id: string): Promise<QRCodeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/qrcode/${id}`, {
      method: "DELETE",
      headers,
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend QR code API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete QR code",
      };
    }

    return {
      success: true,
      message: data.message || "QR code deleted successfully",
    };
  } catch (error) {
    console.error("Delete QR code error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while deleting QR code",
    };
  }
}

// Generate QR code (client-side generation without saving)
export async function generateQRCodeURL(content: string): Promise<string> {
  // This generates a data URL that can be used directly
  // For actual QR code generation, we'll use qrcode.react in the component
  return content;
}

// Bulk generate QR codes
export async function bulkGenerateQRCodes(
  qrDataList: QRCodeData[]
): Promise<QRCodeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/qrcode/bulk`, {
      method: "POST",
      headers,
      body: JSON.stringify({ qrCodes: qrDataList }),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend QR code API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to bulk generate QR codes",
      };
    }

    return {
      success: true,
      message: data.message || "QR codes generated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Bulk generate QR codes error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while bulk generating QR codes",
    };
  }
}

// Scan/verify QR code (for checking validity)
export async function verifyQRCode(content: string): Promise<QRCodeResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/qrcode/verify`, {
      method: "POST",
      headers,
      body: JSON.stringify({ content }),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found. Status: ${response.status}. Please ensure the backend QR code API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to verify QR code",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Verify QR code error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while verifying QR code",
    };
  }
}
