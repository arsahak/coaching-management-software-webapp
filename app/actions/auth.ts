"use server";

import { signOut } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function credentialLogin(formData: FormData): Promise<{
  error?: string;
  ok: boolean;
  url?: string;
}> {
  const email = formData.get("email") as string | null;
  const password = formData.get("password") as string | null;

  // Validate inputs
  if (!email || !password) {
    return { error: "Email and password are required.", ok: false };
  }

  try {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.message || "Invalid email or password. Please try again.",
        ok: false,
      };
    }

    // Return success - client will handle storing token
    return {
      ok: true,
      url: "/",
      accessToken: data.accessToken,
      user: data.user,
    } as any;
  } catch (err: any) {
    console.error("Error during credential login:", err);
    return {
      error: "An unexpected error occurred. Please try again.",
      ok: false,
    };
  }
}

export async function userLogOut(): Promise<void> {
  await signOut({ redirectTo: "/sign-in" });
}

export async function userSignUp(
  formData: FormData
): Promise<{ error?: string; ok: boolean; url?: string }> {
  const requiredFields = ["email", "password", "phone", "businessName"];
  const data = Object.fromEntries(formData.entries());

  for (const field of requiredFields) {
    if (!data[field]) {
      return { error: `${field} is required.`, ok: false };
    }
  }

  try {
    const response = await fetch(`${API_URL}/api/user/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const { error } = await response.json().catch(() => ({}));
      return {
        error: error || "Failed to register. Please try again.",
        ok: false,
      };
    }

    return {
      ok: true,
      url: response.url,
    };
  } catch (err) {
    console.error("Error during user sign-up:", err);
    return {
      error: "A network error occurred. Please try again later.",
      ok: false,
    };
  }
}

export async function userForgetPasswordProcess(
  formData: FormData
): Promise<{ error?: string; ok: boolean; url?: string }> {
  const email = formData.get("email") as string | null;

  if (!email) {
    return {
      error: "Email is required.",
      ok: false,
    };
  }

  try {
    const response = await fetch(`${API_URL}/api/user/forget-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error:
          responseData?.error ||
          "Failed to process your request. Please try again.",
        ok: false,
      };
    }
    return {
      ok: true,
      url: responseData?.url || response.url,
    };
  } catch (err) {
    console.error("Error during forget password process:", err);
    return {
      error: "An unexpected error occurred. Please try again later.",
      ok: false,
    };
  }
}

export async function userForgetPasswordProcessOtpCheck(
  formData: FormData
): Promise<{ error?: string; ok: boolean; url?: string }> {
  const email = formData.get("email") as string | null;
  const otp = formData.get("otp") as string | null;

  if (!email || !otp) {
    return { error: "Email and OTP are required.", ok: false };
  }

  try {
    const response = await fetch(`${API_URL}/api/user/forget-password/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return {
        error:
          errorData?.error ||
          "Failed to process your request. Please try again.",
        ok: false,
      };
    }

    const responseData = await response.json();
    return {
      ok: true,
      url: responseData?.url || "",
    };
  } catch (err) {
    console.error("Error during OTP verification:", err);
    return {
      error: "An unexpected error occurred during OTP verification.",
      ok: false,
    };
  }
}

export async function userForgetPasswordRecovery(
  formData: FormData
): Promise<{ error?: string; ok: boolean; url?: string }> {
  const email = formData.get("email") as string | null;
  const newPassword = formData.get("newPassword") as string | null;

  if (!email || !newPassword) {
    return { error: "Email and New Password are required.", ok: false };
  }

  try {
    const response = await fetch(
      `${API_URL}/api/user/forget-password/recovery`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        error: errorData?.message || "Invalid New Password or server error.",
        ok: false,
      };
    }

    const responseData = await response.json();
    return {
      ok: true,
      url: responseData?.url || "",
    };
  } catch (err) {
    console.error("Error during New Password verification:", err);
    return {
      error: "An unexpected error occurred during New Password verification.",
      ok: false,
    };
  }
}
