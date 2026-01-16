"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: { _id: string; name: string } | string;
  status: "active" | "inactive";
  productsCount?: number;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryResponse {
  success: boolean;
  message?: string;
  data?: Category | Category[];
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

// Get categories with pagination and filters
export async function getCategories(
  page: number = 1,
  limit: number = 20,
  search: string = "",
  status?: string,
  parent?: string,
  sortBy: string = "sortOrder",
  sortOrder: "asc" | "desc" = "asc"
): Promise<CategoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(status && { status }),
      ...(parent !== undefined && { parent }),
      sortBy,
      sortOrder,
    });

    const response = await fetch(`${API_URL}/api/categories?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch categories",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error: any) {
    console.error("Get categories error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while fetching categories",
    };
  }
}

// Get single category by ID
export async function getCategoryById(id: string): Promise<CategoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch category",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error("Get category by ID error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while fetching category",
    };
  }
}

// Create category
export async function createCategory(
  categoryData: Partial<Category>
): Promise<CategoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/categories`, {
      method: "POST",
      headers,
      body: JSON.stringify(categoryData),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Failed to create category",
      };
    }

    return {
      success: true,
      message: data.message || "Category created successfully",
      data: data.data,
    };
  } catch (error: any) {
    console.error("Create category error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while creating category",
    };
  }
}

// Update category
export async function updateCategory(
  id: string,
  categoryData: Partial<Category>
): Promise<CategoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(categoryData),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update category",
      };
    }

    return {
      success: true,
      message: data.message || "Category updated successfully",
      data: data.data,
    };
  } catch (error: any) {
    console.error("Update category error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while updating category",
    };
  }
}

// Delete category
export async function deleteCategory(id: string): Promise<CategoryResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/categories/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete category",
      };
    }

    return {
      success: true,
      message: data.message || "Category deleted successfully",
    };
  } catch (error: any) {
    console.error("Delete category error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while deleting category",
    };
  }
}