"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface ProductImage {
  url: string;
  isPrimary: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stock: number;
  lowStockThreshold?: number;
  category: { _id: string; name: string; slug: string } | string;
  images: ProductImage[];
  status: "active" | "draft" | "archived";
  featured: boolean;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { name: string; email: string };
}

export interface ProductResponse {
  success: boolean;
  message?: string;
  data?: Product | Product[];
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

// Helper to get headers for Multipart requests (upload) - No Content-Type
async function getMultipartAuthHeaders(): Promise<HeadersInit> {
  const session = await auth();
  const token = session?.accessToken;

  return {
    ...(token && { Authorization: `Bearer ${token}` }),
  };
}

async function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch (e) {
      // Clone response to read text since json() might have consumed it (though usually safe if json failed)
      // Actually json() consumes body. If it fails, body is used.
      // fetch response body can only be read once.
      console.error(`JSON Parse Error for ${response.url}.`);
      throw new Error(`Invalid JSON response from server (Status ${response.status})`);
    }
  } else {
    const text = await response.text();
    console.error(`Non-JSON response from ${response.url}:`, text.substring(0, 200));
    throw new Error(`Server returned non-JSON response (Status ${response.status})`);
  }
}

// Get products with pagination and filters
export async function getProducts(
  page: number = 1,
  limit: number = 20,
  search: string = "",
  filters?: {
    category?: string;
    status?: string;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }
): Promise<ProductResponse> {
  try {
    const headers = await getAuthHeaders();

    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(filters?.category && { category: filters.category }),
      ...(filters?.status && { status: filters.status }),
      ...(filters?.featured !== undefined && {
        featured: String(filters.featured),
      }),
      ...(filters?.minPrice && { minPrice: String(filters.minPrice) }),
      ...(filters?.maxPrice && { maxPrice: String(filters.maxPrice) }),
    });

    const response = await fetch(`${API_URL}/api/products?${params}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch products",
      };
    }

    return {
      success: true,
      data: data.data,
      pagination: data.pagination,
    };
  } catch (error: any) {
    console.error("Get products error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while fetching products",
    };
  }
}

// Get single product by ID
export async function getProductById(id: string): Promise<ProductResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch product",
      };
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: any) {
    console.error("Get product by ID error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while fetching product",
    };
  }
}

// Create product (accepts FormData for file uploads)
export async function createProduct(
  formData: FormData
): Promise<ProductResponse> {
  try {
    const headers = await getMultipartAuthHeaders();

    const response = await fetch(`${API_URL}/api/products`, {
      method: "POST",
      headers,
      body: formData,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || "Failed to create product",
      };
    }

    return {
      success: true,
      message: data.message || "Product created successfully",
      data: data.data,
    };
  } catch (error: any) {
    console.error("Create product error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while creating product",
    };
  }
}

// Update product
export async function updateProduct(
  id: string,
  formData: FormData
): Promise<ProductResponse> {
  try {
    const headers = await getMultipartAuthHeaders();

    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: "PUT",
      headers,
      body: formData,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update product",
      };
    }

    return {
      success: true,
      message: data.message || "Product updated successfully",
      data: data.data,
    };
  } catch (error: any) {
    console.error("Update product error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while updating product",
    };
  }
}

// Delete product
export async function deleteProduct(id: string): Promise<ProductResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/products/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete product",
      };
    }

    return {
      success: true,
      message: data.message || "Product deleted successfully",
    };
  } catch (error: any) {
    console.error("Delete product error:", error);
    return {
      success: false,
      error: error.message || "An error occurred while deleting product",
    };
  }
}
