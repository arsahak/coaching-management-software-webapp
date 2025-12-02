"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export interface PortfolioData {
  appTitle?: string;
  appLogo?: string;
  appDescription?: string;
  appTagline?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  metaKeywords?: string;
  metaDescription?: string;
  copyrightText?: string;
}

export interface PortfolioResponse {
  success: boolean;
  message?: string;
  data?: PortfolioData;
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

// Get portfolio settings (public endpoint - no auth required)
export async function getPortfolio(): Promise<PortfolioResponse> {
  try {
    const response = await fetch(`${API_URL}/api/portfolio`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found or server error. Status: ${response.status}. Please ensure the backend portfolio API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch portfolio settings",
      };
    }

    return {
      success: true,
      message: data.message,
      data: data.data,
    };
  } catch (error) {
    console.error("Get portfolio error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while fetching portfolio settings",
    };
  }
}

// Update portfolio settings
export async function updatePortfolio(
  portfolioData: PortfolioData
): Promise<PortfolioResponse> {
  try {
    const headers = await getAuthHeaders();

    const response = await fetch(`${API_URL}/api/portfolio`, {
      method: "PUT",
      headers,
      body: JSON.stringify(portfolioData),
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get("content-type");
    let data;

    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // If not JSON, likely an HTML error page
      const text = await response.text();
      console.error("Non-JSON response:", text.substring(0, 200));
      return {
        success: false,
        error: `API endpoint not found or server error. Status: ${response.status}. Please ensure the backend portfolio API is implemented.`,
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to update portfolio settings",
      };
    }

    return {
      success: true,
      message: data.message || "Portfolio settings updated successfully",
      data: data.data,
    };
  } catch (error) {
    console.error("Update portfolio error:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while updating portfolio settings",
    };
  }
}
