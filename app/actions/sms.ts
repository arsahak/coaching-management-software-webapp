"use server";

import { auth } from "@/auth";

// Server-side only — do not use NEXT_PUBLIC_ for backend calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface SMSData {
  mobileNumber?: string;
  mobileNumbers?: string[];
  message: string;
  senderId?: string;
  apiKey?: string;
  messages?: Array<{ number: string; message: string }>;
  filters?: {
    class?: string;
    batchName?: string;
    studentId?: string;
  };
}

export interface SMSResponse {
  success: boolean;
  message?: string;
  data?: unknown;
  error?: string;
  code?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// ─── Auth headers ────────────────────────────────────────────────────────────

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const token = session?.accessToken;
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

// ─── Shared response parser ───────────────────────────────────────────────────
// The backend always returns HTTP 200. We must read data.success from the body.

async function parseResponse(
  response: Response,
  fallbackError: string
): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("Non-JSON response:", text.substring(0, 200));
    return {
      ok: false,
      data: { message: `API endpoint not found (status ${response.status})` },
    };
  }

  const data = await response.json();

  // HTTP error (4xx / 5xx)
  if (!response.ok) {
    return { ok: false, data };
  }

  // HTTP 200 but gateway/backend reported failure
  if (data.success === false) {
    return { ok: false, data };
  }

  return { ok: true, data };
}

// ─── Send single SMS ──────────────────────────────────────────────────────────

export async function sendSingleSMS(smsData: {
  mobileNumber: string;
  message: string;
  senderId?: string;
  apiKey?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/sms/send`, {
      method: "POST",
      headers,
      body: JSON.stringify(smsData),
    });

    const { ok, data } = await parseResponse(response, "Failed to send SMS");

    if (!ok) {
      return {
        success: false,
        error: (data.message as string) || "Failed to send SMS",
        code: data.code as number | undefined,
      };
    }

    return {
      success: true,
      message: (data.message as string) || "SMS sent successfully",
      data: data.data,
      code: data.code as number | undefined,
    };
  } catch (error) {
    console.error("Send single SMS error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An error occurred while sending SMS",
    };
  }
}

// ─── Send bulk SMS (same message) ─────────────────────────────────────────────

export async function sendBulkSMS(smsData: {
  mobileNumbers: string[];
  message: string;
  senderId?: string;
  apiKey?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/sms/bulk`, {
      method: "POST",
      headers,
      body: JSON.stringify(smsData),
    });

    const { ok, data } = await parseResponse(response, "Failed to send bulk SMS");

    if (!ok) {
      return {
        success: false,
        error: (data.message as string) || "Failed to send bulk SMS",
        code: data.code as number | undefined,
      };
    }

    return {
      success: true,
      message: (data.message as string) || "Bulk SMS sent successfully",
      data: data.data,
      code: data.code as number | undefined,
    };
  } catch (error) {
    console.error("Send bulk SMS error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An error occurred while sending bulk SMS",
    };
  }
}

// ─── Send bulk SMS (different messages) ───────────────────────────────────────

export async function sendBulkSMSCustom(smsData: {
  messages: Array<{ number: string; message: string }>;
  senderId?: string;
  apiKey?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/sms/bulk/custom`, {
      method: "POST",
      headers,
      body: JSON.stringify(smsData),
    });

    const { ok, data } = await parseResponse(response, "Failed to send bulk SMS");

    if (!ok) {
      return {
        success: false,
        error: (data.message as string) || "Failed to send bulk SMS",
        code: data.code as number | undefined,
      };
    }

    return {
      success: true,
      message: (data.message as string) || "Bulk SMS sent successfully",
      data: data.data,
      code: data.code as number | undefined,
    };
  } catch (error) {
    console.error("Send bulk SMS custom error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An error occurred while sending bulk SMS",
    };
  }
}

// ─── Send SMS to students ──────────────────────────────────────────────────────

export async function sendSMSToStudents(smsData: {
  message: string;
  filters?: {
    class?: string;
    batchName?: string;
    studentId?: string;
  };
  senderId?: string;
  apiKey?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/sms/send/students`, {
      method: "POST",
      headers,
      body: JSON.stringify(smsData),
    });

    const { ok, data } = await parseResponse(response, "Failed to send SMS to students");

    if (!ok) {
      return {
        success: false,
        error: (data.message as string) || "Failed to send SMS to students",
        code: data.code as number | undefined,
      };
    }

    return {
      success: true,
      message: (data.message as string) || "SMS sent to students successfully",
      data: data.data,
      code: data.code as number | undefined,
    };
  } catch (error) {
    console.error("Send SMS to students error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while sending SMS to students",
    };
  }
}

// ─── Get SMS history ───────────────────────────────────────────────────────────

export async function getSMSHistory(
  page: number = 1,
  limit: number = 50,
  filters?: {
    type?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }
): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(filters?.type && { type: filters.type }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
      ...(filters?.search && { search: filters.search }),
    });

    const response = await fetch(`${API_URL}/api/sms?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const { ok, data } = await parseResponse(response, "Failed to fetch SMS history");

    if (!ok) {
      return {
        success: false,
        error: (data.message as string) || "Failed to fetch SMS history",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination as SMSResponse["pagination"],
    };
  } catch (error) {
    console.error("Get SMS history error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An error occurred while fetching SMS history",
    };
  }
}

// ─── Get SMS statistics ────────────────────────────────────────────────────────

export async function getSMSStats(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<SMSResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
    });

    const response = await fetch(`${API_URL}/api/sms/stats?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const { ok, data } = await parseResponse(response, "Failed to fetch SMS statistics");

    if (!ok) {
      return {
        success: false,
        error: (data.message as string) || "Failed to fetch SMS statistics",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error("Get SMS stats error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching SMS statistics",
    };
  }
}
