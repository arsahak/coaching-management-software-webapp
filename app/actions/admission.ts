"use server";

import { revalidatePath } from "next/cache";

export async function createAdmission(formData: FormData) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return {
        success: false,
        error: "API URL is not configured",
      };
    }

    const response = await fetch(`${apiUrl}/admission`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to create admission",
      };
    }

    revalidatePath("/admission");
    return {
      success: true,
      message: data.message || "Admission created successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Create admission error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function updateAdmission(id: string, formData: FormData) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return {
        success: false,
        error: "API URL is not configured",
      };
    }

    const response = await fetch(`${apiUrl}/admission/${id}`, {
      method: "PUT",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update admission",
      };
    }

    revalidatePath("/admission");
    revalidatePath(`/admission/${id}`);
    return {
      success: true,
      message: data.message || "Admission updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Update admission error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

export async function deleteAdmission(id: string) {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      return {
        success: false,
        error: "API URL is not configured",
      };
    }

    const response = await fetch(`${apiUrl}/admission/${id}`, {
      method: "DELETE",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to delete admission",
      };
    }

    revalidatePath("/admission");
    return {
      success: true,
      message: data.message || "Admission deleted successfully",
    };
  } catch (error) {
    console.error("Delete admission error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
