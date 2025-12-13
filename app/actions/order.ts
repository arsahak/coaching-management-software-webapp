"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface OrderItem {
  product: { _id: string; name: string; images: { url: string }[] };
  productName: string;
  sku: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customer: { _id: string; name: string; email: string };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  subtotal: number;
  orderStatus: string;
  paymentInfo: { status: string; method: string };
  shippingAddress: any;
  orderDate: string;
  createdAt: string;
}

export interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenue: number;
}

export interface OrderResponse {
  success: boolean;
  message?: string;
  data?: Order | Order[] | OrderStats;
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

export async function getOrders(
  page: number = 1,
  limit: number = 20,
  search: string = ""
): Promise<OrderResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await fetch(`${API_URL}/api/orders?${params}`, {
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

export async function getOrderById(id: string): Promise<OrderResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/orders/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
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

export async function createOrder(orderData: any): Promise<OrderResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
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

export async function updateOrder(id: string, orderData: any): Promise<OrderResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/orders/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(orderData),
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

export async function updateOrderStatus(id: string, statusData: any): Promise<OrderResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(statusData),
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

export async function deleteOrder(id: string): Promise<OrderResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/orders/${id}`, {
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

export async function getOrderStats(startDate?: string, endDate?: string): Promise<OrderResponse> {
  try {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams({
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    });

    const response = await fetch(`${API_URL}/api/orders/stats?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
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

export async function getRecentOrders(limit: number = 5): Promise<OrderResponse> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/api/orders/recent?limit=${limit}`, {
      method: "GET",
      headers,
      cache: "no-store",
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