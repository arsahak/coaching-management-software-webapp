"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface AdmissionData {
  studentName: string;
  fatherName: string;
  motherName: string;
  schoolName: string;
  fatherMobile: string;
  motherMobile?: string;
  studentMobile?: string;
  class: string;
  subjects: string[];
  batchName: string;
  batchTime: string;
  admissionDate: string;
  monthlyFee: number;
  studentSignature?: string;
  directorSignature?: string;
  notes?: string;
  // Notification targets
  alarmMobile?: string[];
}

export interface Admission {
  _id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  schoolName: string;
  fatherMobile: string;
  motherMobile?: string;
  studentMobile?: string;
  class: string;
  subjects: string[];
  batchName: string;
  batchTime: string;
  admissionDate: string;
  monthlyFee: number;
  studentId?: string;
  status: "active" | "inactive" | "completed";
  notes?: string;
  alarmMobile?: string[];
  smsHistory?: string[];
  emailHistory?: string[];
}

export interface AdmissionResponse {
  success: boolean;
  message?: string;
  data?: Admission[];
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

// Get admissions with search and pagination
export async function getAdmissions(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  filters?: {
    class?: string;
    batch?: string;
    status?: string;
  }
): Promise<AdmissionResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(filters?.class && { class: filters.class }),
      ...(filters?.batch && { batch: filters.batch }),
      ...(filters?.status && { status: filters.status }),
    });

    const response = await fetch(`${API_URL}/api/admission?${params}`, {
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

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch admissions",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Get admissions error:", error);
    return {
      success: false,
      error: "An error occurred while fetching admissions",
    };
  }
}

// Get single admission by ID
export async function getAdmissionById(id: string): Promise<AdmissionResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/admission/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch admission",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get admission by ID error:", error);
    return {
      success: false,
      error: "An error occurred while fetching admission",
    };
  }
}

// Create admission
export async function createAdmission(
  formData: FormData
): Promise<AdmissionResponse> {
  try {
    const headers = await getAuthHeaders();

    const admissionData: Partial<AdmissionData> = {
      studentName: formData.get("studentName") as string,
      fatherName: formData.get("fatherName") as string,
      motherName: formData.get("motherName") as string,
      schoolName: formData.get("schoolName") as string,
      fatherMobile: formData.get("fatherMobile") as string,
      motherMobile: (formData.get("motherMobile") as string) || undefined,
      studentMobile: (formData.get("studentMobile") as string) || undefined,
      class: formData.get("class") as string,
      subjects: formData.getAll("subjects") as string[],
      batchName: formData.get("batchName") as string,
      batchTime: formData.get("batchTime") as string,
      admissionDate: formData.get("admissionDate") as string,
      monthlyFee: Number(formData.get("monthlyFee")),
      studentSignature:
        (formData.get("studentSignature") as string) || undefined,
      directorSignature:
        (formData.get("directorSignature") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    // Build alarmMobile list if present; fallback to parent / student numbers
    const alarmMobilesFromForm = formData.getAll("alarmMobile") as string[];
    const fallbackAlarmMobiles = [
      admissionData.fatherMobile,
      admissionData.motherMobile,
      admissionData.studentMobile,
    ].filter(Boolean) as string[];

    admissionData.alarmMobile =
      alarmMobilesFromForm.length > 0
        ? alarmMobilesFromForm
        : fallbackAlarmMobiles;

    const response = await fetch(`${API_URL}/api/admission`, {
      method: "POST",
      headers,
      body: JSON.stringify(admissionData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create admission",
      };
    }

    return {
      success: true,
      message: data.message || "Admission created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Create admission error:", error);
    return {
      success: false,
      error: "An error occurred while creating admission",
    };
  }
}

// Update admission
export async function updateAdmission(
  id: string,
  formData: FormData
): Promise<AdmissionResponse> {
  try {
    const headers = await getAuthHeaders();

    const admissionData: Partial<AdmissionData> = {
      studentName: formData.get("studentName") as string,
      fatherName: formData.get("fatherName") as string,
      motherName: formData.get("motherName") as string,
      schoolName: formData.get("schoolName") as string,
      fatherMobile: formData.get("fatherMobile") as string,
      motherMobile: (formData.get("motherMobile") as string) || undefined,
      studentMobile: (formData.get("studentMobile") as string) || undefined,
      class: formData.get("class") as string,
      subjects: formData.getAll("subjects") as string[],
      batchName: formData.get("batchName") as string,
      batchTime: formData.get("batchTime") as string,
      admissionDate: formData.get("admissionDate") as string,
      monthlyFee: Number(formData.get("monthlyFee")),
      studentSignature:
        (formData.get("studentSignature") as string) || undefined,
      directorSignature:
        (formData.get("directorSignature") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    };

    const alarmMobilesFromForm = formData.getAll("alarmMobile") as string[];
    const fallbackAlarmMobiles = [
      admissionData.fatherMobile,
      admissionData.motherMobile,
      admissionData.studentMobile,
    ].filter(Boolean) as string[];

    admissionData.alarmMobile =
      alarmMobilesFromForm.length > 0
        ? alarmMobilesFromForm
        : fallbackAlarmMobiles;

    const response = await fetch(`${API_URL}/api/admission/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(admissionData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update admission",
      };
    }

    return {
      success: true,
      message: data.message || "Admission updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Update admission error:", error);
    return {
      success: false,
      error: "An error occurred while updating admission",
    };
  }
}

// Delete admission
export async function deleteAdmission(id: string): Promise<AdmissionResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/admission/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete admission",
      };
    }

    return {
      success: true,
      message: data.message || "Admission deleted successfully",
    };
  } catch (error) {
    console.error("Delete admission error:", error);
    return {
      success: false,
      error: "An error occurred while deleting admission",
    };
  }
}

// Get admission statistics
export async function getAdmissionStats(): Promise<AdmissionResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/admission/stats`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch statistics",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get admission stats error:", error);
    return {
      success: false,
      error: "An error occurred while fetching statistics",
    };
  }
}
