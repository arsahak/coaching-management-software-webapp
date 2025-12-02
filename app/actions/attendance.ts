"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface AttendanceData {
  admissionId: string;
  date: string;
  status: "present" | "absent";
  notes?: string;
}

export interface AttendanceResponse {
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

// Mark attendance for a single student
export async function markAttendance(
  attendanceData: AttendanceData
): Promise<AttendanceResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/attendance`, {
      method: "POST",
      headers,
      body: JSON.stringify(attendanceData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to mark attendance",
      };
    }

    return {
      success: true,
      message: data.message || "Attendance marked successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Mark attendance error:", error);
    return {
      success: false,
      error: "An error occurred while marking attendance",
    };
  }
}

// Mark attendance for multiple students (batch)
export async function markBatchAttendance(
  date: string,
  attendances: Array<{
    admissionId: string;
    status: "present" | "absent";
    notes?: string;
  }>
): Promise<AttendanceResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/attendance/batch`, {
      method: "POST",
      headers,
      body: JSON.stringify({ date, attendances }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to mark batch attendance",
      };
    }

    return {
      success: true,
      message: data.message || "Batch attendance marked successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Mark batch attendance error:", error);
    return {
      success: false,
      error: "An error occurred while marking batch attendance",
    };
  }
}

// Get attendance records
export async function getAttendances(
  page: number = 1,
  limit: number = 50,
  filters?: {
    admissionId?: string;
    studentId?: string;
    startDate?: string;
    endDate?: string;
    status?: "present" | "absent";
    class?: string;
    batchName?: string;
  }
): Promise<AttendanceResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.admissionId && { admissionId: filters.admissionId }),
      ...(filters?.studentId && { studentId: filters.studentId }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.class && { class: filters.class }),
      ...(filters?.batchName && { batchName: filters.batchName }),
    });

    const response = await fetch(`${API_URL}/api/attendance?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch attendances",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Get attendances error:", error);
    return {
      success: false,
      error: "An error occurred while fetching attendances",
    };
  }
}

// Get attendance statistics
export async function getAttendanceStats(filters?: {
  admissionId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  class?: string;
  batchName?: string;
}): Promise<AttendanceResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams();
    if (filters?.admissionId) params.append("admissionId", filters.admissionId);
    if (filters?.studentId) params.append("studentId", filters.studentId);
    if (filters?.startDate) params.append("startDate", filters.startDate);
    if (filters?.endDate) params.append("endDate", filters.endDate);
    if (filters?.class) params.append("class", filters.class);
    if (filters?.batchName) params.append("batchName", filters.batchName);

    const response = await fetch(`${API_URL}/api/attendance/stats?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch attendance statistics",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get attendance stats error:", error);
    return {
      success: false,
      error: "An error occurred while fetching attendance statistics",
    };
  }
}

// Get student attendance report (weekly/monthly)
export async function getStudentAttendanceReport(
  admissionId?: string,
  studentId?: string,
  period: "week" | "month" = "month"
): Promise<AttendanceResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      period,
      ...(admissionId && { admissionId }),
      ...(studentId && { studentId }),
    });

    const response = await fetch(`${API_URL}/api/attendance/report?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch attendance report",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get student attendance report error:", error);
    return {
      success: false,
      error: "An error occurred while fetching attendance report",
    };
  }
}

// Send attendance report SMS
export async function sendAttendanceReportSMS(
  admissionId?: string,
  studentId?: string,
  period: "week" | "month" = "month"
): Promise<AttendanceResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/attendance/report/sms`, {
      method: "POST",
      headers,
      body: JSON.stringify({ admissionId, studentId, period }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send attendance report SMS",
      };
    }

    return {
      success: true,
      message: data.message || "Attendance report SMS sent successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Send attendance report SMS error:", error);
    return {
      success: false,
      error: "An error occurred while sending attendance report SMS",
    };
  }
}

// Delete attendance
export async function deleteAttendance(
  id: string
): Promise<AttendanceResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/attendance/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete attendance",
      };
    }

    return {
      success: true,
      message: data.message || "Attendance deleted successfully",
    };
  } catch (error) {
    console.error("Delete attendance error:", error);
    return {
      success: false,
      error: "An error occurred while deleting attendance",
    };
  }
}
