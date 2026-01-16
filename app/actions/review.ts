"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Review {
  _id: string;
  product: { _id: string; name: string; slug: string; images: { url: string }[] };
  customer: { _id: string; name: string; avatar?: string };
  customerName: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  response?: {
    text: string;
    respondedAt: string;
  };
}

export interface ReviewResponse {
  success: boolean;
  message?: string;
  data?: Review | Review[];
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const token = session?.accessToken;

  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (e) {
      console.error(`JSON Parse Error for ${response.url}.`);
      throw new Error(`Invalid JSON response from server (Status ${response.status})`);
    }
  } else {
    const text = await response.text();
    console.error(`Non-JSON response from ${response.url}:`, text.substring(0, 200));
    throw new Error(`Server returned non-JSON response (Status ${response.status})`);
  }
}

export async function getReviews(
  page: number = 1,
  limit: number = 20,
  status: string = "",
  search: string = "" // Not supported by backend yet but interface placeholder
): Promise<ReviewResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(status && { status }),
    });

    const response = await fetch(`${API_URL}/api/reviews?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message };
    }

    return { success: true, data: data.data, pagination: data.pagination };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateReviewStatus(id: string, status: string): Promise<ReviewResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/reviews/${id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message };
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteReview(id: string): Promise<ReviewResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/reviews/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message };
    }

    return { success: true, message: data.message };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function replyToReview(id: string, text: string): Promise<ReviewResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/reviews/${id}/reply`, {
      method: "POST",
      headers,
      body: JSON.stringify({ text }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return { success: false, error: data.message };
    }

    return { success: true, data: data.data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
