"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ExamData {
  examName: string;
  examType: "quiz" | "midterm" | "final" | "assignment" | "other";
  subject: string;
  class: string;
  batchName?: string;
  description?: string;
  examDate: string;
  examTime: string;
  duration?: number;
}

export interface ExamResultData {
  examId: string;
  admissionId: string;
  marks: number;
  totalMarks: number;
  grade?: string;
  present?: boolean;
  notes?: string;
}

export interface ExamResponse {
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

// Create exam
export async function createExam(examData: ExamData): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam`, {
      method: "POST",
      headers,
      body: JSON.stringify(examData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create exam",
      };
    }

    return {
      success: true,
      message: data.message || "Exam created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Create exam error:", error);
    return {
      success: false,
      error: "An error occurred while creating exam",
    };
  }
}

// Get exams
export async function getExams(
  page: number = 1,
  limit: number = 50,
  filters?: {
    class?: string;
    batchName?: string;
    subject?: string;
    examType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }
): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.class && { class: filters.class }),
      ...(filters?.batchName && { batchName: filters.batchName }),
      ...(filters?.subject && { subject: filters.subject }),
      ...(filters?.examType && { examType: filters.examType }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
    });

    const response = await fetch(`${API_URL}/api/exam?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch exams",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Get exams error:", error);
    return {
      success: false,
      error: "An error occurred while fetching exams",
    };
  }
}

// Get single exam by ID
export async function getExamById(id: string): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch exam",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get exam by ID error:", error);
    return {
      success: false,
      error: "An error occurred while fetching exam",
    };
  }
}

// Update exam
export async function updateExam(
  id: string,
  examData: Partial<ExamData>
): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(examData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update exam",
      };
    }

    return {
      success: true,
      message: data.message || "Exam updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Update exam error:", error);
    return {
      success: false,
      error: "An error occurred while updating exam",
    };
  }
}

// Delete exam
export async function deleteExam(id: string): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete exam",
      };
    }

    return {
      success: true,
      message: data.message || "Exam deleted successfully",
    };
  } catch (error) {
    console.error("Delete exam error:", error);
    return {
      success: false,
      error: "An error occurred while deleting exam",
    };
  }
}

// Send exam schedule SMS
export async function sendExamScheduleSMS(
  examId: string
): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam/schedule/sms`, {
      method: "POST",
      headers,
      body: JSON.stringify({ examId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send exam schedule SMS",
      };
    }

    return {
      success: true,
      message: data.message || "Exam schedule SMS sent successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Send exam schedule SMS error:", error);
    return {
      success: false,
      error: "An error occurred while sending exam schedule SMS",
    };
  }
}

// Create exam result
export async function createExamResult(
  resultData: ExamResultData
): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam/results`, {
      method: "POST",
      headers,
      body: JSON.stringify(resultData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create exam result",
      };
    }

    return {
      success: true,
      message: data.message || "Exam result created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Create exam result error:", error);
    return {
      success: false,
      error: "An error occurred while creating exam result",
    };
  }
}

// Create batch exam results
export async function createBatchExamResults(
  examId: string,
  results: Array<{
    admissionId: string;
    marks: number;
    totalMarks: number;
    grade?: string;
    present?: boolean;
    notes?: string;
  }>
): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam/results/batch`, {
      method: "POST",
      headers,
      body: JSON.stringify({ examId, results }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create batch exam results",
      };
    }

    return {
      success: true,
      message: data.message || "Batch exam results created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Create batch exam results error:", error);
    return {
      success: false,
      error: "An error occurred while creating batch exam results",
    };
  }
}

// Get exam results
export async function getExamResults(
  examId?: string,
  admissionId?: string,
  studentId?: string,
  page: number = 1,
  limit: number = 50
): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(examId && { examId }),
      ...(admissionId && { admissionId }),
      ...(studentId && { studentId }),
    });

    const response = await fetch(`${API_URL}/api/exam/results?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch exam results",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error) {
    console.error("Get exam results error:", error);
    return {
      success: false,
      error: "An error occurred while fetching exam results",
    };
  }
}

// Send exam result SMS
export async function sendExamResultSMS(
  examId: string,
  admissionId?: string,
  studentId?: string
): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam/results/sms`, {
      method: "POST",
      headers,
      body: JSON.stringify({ examId, admissionId, studentId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to send exam result SMS",
      };
    }

    return {
      success: true,
      message: data.message || "Exam result SMS sent successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Send exam result SMS error:", error);
    return {
      success: false,
      error: "An error occurred while sending exam result SMS",
    };
  }
}

// Get exam statistics
export async function getExamStats(examId: string): Promise<ExamResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/exam/stats?examId=${examId}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch exam statistics",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get exam stats error:", error);
    return {
      success: false,
      error: "An error occurred while fetching exam statistics",
    };
  }
}
