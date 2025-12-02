"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface SubUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface UserManagementResponse {
  success: boolean;
  message?: string;
  data?: SubUser | SubUser[];
  error?: string;
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

// Get all sub-users
export async function getSubUsers(): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/users/sub-users`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found or server error. Status: ${response.status}.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch sub-users",
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data || data.users || [],
    };
  } catch (error) {
    console.error("Get sub-users error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching sub-users",
    };
  }
}

// Create sub-user
export async function createSubUser(userData: {
  name: string;
  email: string;
  password: string;
  role: string;
  userType?: string;
  avatar?: string;
  permissions?: string[];
}): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/users/sub-users`, {
      method: "POST",
      headers,
      body: JSON.stringify(userData),
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found or server error. Status: ${response.status}.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create sub-user",
      };
    }

    return {
      success: true,
      message: data.message || "Sub-user created successfully",
      data: data.data || data.user,
    };
  } catch (error) {
    console.error("Create sub-user error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating sub-user",
    };
  }
}

// Update sub-user
export async function updateSubUser(
  userId: string,
  userData: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
  }
): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();

    // Remove empty password
    const updateData = { ...userData };
    if (!updateData.password || updateData.password.trim() === "") {
      delete updateData.password;
    }

    const response = await fetch(`${API_URL}/api/users/sub-users/${userId}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(updateData),
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found or server error. Status: ${response.status}.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update sub-user",
      };
    }

    return {
      success: true,
      message: data.message || "Sub-user updated successfully",
      data: data.data || data.user,
    };
  } catch (error) {
    console.error("Update sub-user error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while updating sub-user",
    };
  }
}

// Delete sub-user
export async function deleteSubUser(
  userId: string
): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/users/sub-users/${userId}`, {
      method: "DELETE",
      headers,
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found or server error. Status: ${response.status}.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete sub-user",
      };
    }

    return {
      success: true,
      message: data.message || "Sub-user deleted successfully",
    };
  } catch (error) {
    console.error("Delete sub-user error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while deleting sub-user",
    };
  }
}

// Update user permissions
export async function updateUserPermissions(
  userId: string,
  permissions: string[]
): Promise<UserManagementResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(
      `${API_URL}/api/users/sub-users/${userId}/permissions`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({ permissions }),
      }
    );

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found or server error. Status: ${response.status}.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update permissions",
      };
    }

    return {
      success: true,
      message: data.message || "Permissions updated successfully",
      data: data.data || data.user,
    };
  } catch (error) {
    console.error("Update permissions error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while updating permissions",
    };
  }
}
