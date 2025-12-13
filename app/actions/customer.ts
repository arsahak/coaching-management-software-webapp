"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface CustomerAddress {
  _id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  avatar?: string;
  addresses?: CustomerAddress[];
  totalOrders?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  createdAt: string;
}

export interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  topCustomers: Customer[];
}

export interface CustomerResponse {
  success: boolean;
  message?: string;
  data?: Customer | Customer[] | CustomerStats;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Helper to get headers for JSON requests
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

// Get customers with pagination and search
export async function getCustomers(
  page: number = 1,
  limit: number = 20,
  search: string = "",
  sortBy: string = "createdAt",
  sortOrder: "asc" | "desc" = "desc"
): Promise<CustomerResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      sortBy,
      sortOrder,
    });

    // Use /api/customers for admin view (all customers)
    const response = await fetch(`${API_URL}/api/customers?${params}`, {
        method: "GET",
        headers,
        cache: "no-store"
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch customers",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error: any) {
    console.error("Get customers error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while fetching customers",
    };
  }
}

// Get customer stats
export async function getCustomerStats(): Promise<CustomerResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/customers/stats`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch customer stats",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error("Get customer stats error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while fetching customer stats",
    };
  }
}

// Get single customer by ID
export async function getCustomerById(id: string): Promise<CustomerResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/customers/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch customer",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error("Get customer by ID error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while fetching customer",
    };
  }
}

// Create customer (Admin action)
export async function createCustomer(
  customerData: Partial<Customer>
): Promise<CustomerResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/customers`, {
      method: "POST",
      headers,
      body: JSON.stringify(customerData),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Failed to create customer",
      };
    }

    return {
      success: true,
      message: data.message || "Customer created successfully",
      data: data.data,
    };
  } catch (error: any) {
    console.error("Create customer error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while creating customer",
    };
  }
}

// Update customer
export async function updateCustomer(
  id: string,
  customerData: Partial<Customer>
): Promise<CustomerResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/customers/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(customerData),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update customer",
      };
    }

    return {
      success: true,
      message: data.message || "Customer updated successfully",
      data: data.data,
    };
  } catch (error: any) {
    console.error("Update customer error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while updating customer",
    };
  }
}

// Delete customer
export async function deleteCustomer(id: string): Promise<CustomerResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/customers/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete customer",
      };
    }

    return {
      success: true,
      message: data.message || "Customer deleted successfully",
    };
  } catch (error: any) {
    console.error("Delete customer error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while deleting customer",
    };
  }
}