"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { getTranslation } from "@/lib/translations";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { IoMdEye, IoMdEyeOff, IoMdLock, IoMdMail } from "react-icons/io";

const SigninPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [isPending, startTransition] = useTransition();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email =
        getTranslation("emailRequired", language) || "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email =
        getTranslation("invalidEmail", language) || "Invalid email format";
    }

    if (!password) {
      newErrors.password =
        getTranslation("passwordRequired", language) || "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        getTranslation("passwordMinLength", language) ||
        "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Get user-friendly error message based on error type
  const getErrorMessage = (
    error: string
  ): { message: string; field?: "email" | "password" | "general" } => {
    const errorLower = error.toLowerCase();

    // Check for server/connection issues first
    if (
      errorLower.includes("unable to connect") ||
      errorLower.includes("backend") ||
      errorLower.includes("server") ||
      errorLower.includes("fetch failed") ||
      errorLower.includes("econnrefused")
    ) {
      return {
        message:
          getTranslation("serverError", language) ||
          "Unable to connect to server. Please make sure the backend is running.",
        field: "general",
      };
    }

    // Check for specific error patterns
    if (
      errorLower.includes("credentials") ||
      errorLower.includes("credentialssignin")
    ) {
      return {
        message:
          getTranslation("invalidCredentials", language) ||
          "Invalid email or password. Please check your credentials and try again.",
        field: "general",
      };
    }

    if (
      errorLower.includes("user not found") ||
      errorLower.includes("no user") ||
      errorLower.includes("no account")
    ) {
      return {
        message:
          getTranslation("userNotFound", language) ||
          "No account found with this email. Please check your email or sign up.",
        field: "email",
      };
    }

    if (
      errorLower.includes("invalid password") ||
      errorLower.includes("wrong password") ||
      errorLower.includes("incorrect password") ||
      errorLower.includes("invalid email or password")
    ) {
      return {
        message:
          getTranslation("wrongPassword", language) ||
          "Invalid email or password. Please try again.",
        field: "general",
      };
    }

    if (errorLower.includes("email") && errorLower.includes("invalid")) {
      return {
        message:
          getTranslation("invalidEmail", language) || "Invalid email address.",
        field: "email",
      };
    }

    if (
      errorLower.includes("account") &&
      (errorLower.includes("locked") || errorLower.includes("disabled"))
    ) {
      return {
        message:
          getTranslation("accountLocked", language) ||
          "Your account has been locked. Please contact support.",
        field: "general",
      };
    }

    if (
      errorLower.includes("network") ||
      errorLower.includes("connection") ||
      errorLower.includes("timeout")
    ) {
      return {
        message:
          getTranslation("networkError", language) ||
          "Network error. Please check your connection and try again.",
        field: "general",
      };
    }

    // Default error message - use the actual error if it's meaningful
    const defaultMessage =
      error.length > 10 && error.length < 200
        ? error
        : getTranslation("loginFailed", language) ||
          "Login failed. Please check your credentials and try again.";

    return {
      message: defaultMessage,
      field: "general",
    };
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clear all previous errors
    setErrors({});

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          const { message, field } = getErrorMessage(result.error);

          // Set field-specific error or general error
          if (field === "email") {
            setErrors({ email: message });
          } else if (field === "password") {
            setErrors({ password: message });
          } else {
            setErrors({ general: message });
          }

          toast.error(message);
          return;
        }

        if (result?.ok) {
          toast.success(
            getTranslation("loginSuccessful", language) || "Login successful!"
          );
          router.push(callbackUrl);
          router.refresh();
        }
      } catch (error) {
        console.error("Login error:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An unexpected error occurred";
        setErrors({
          general:
            getTranslation("unexpectedError", language) ||
            "An unexpected error occurred. Please try again later.",
        });
        toast.error(errorMessage);
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getTranslation("signIn", language) || "Sign In"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {getTranslation("signInToContinue", language) ||
              "Sign in to continue to your account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error Alert */}
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {errors.general}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {getTranslation("email", language) || "Email"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoMdMail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear email and general errors when user starts typing
                  if (errors.email || errors.general) {
                    setErrors((prev) => ({
                      ...prev,
                      email: undefined,
                      general: undefined,
                    }));
                  }
                }}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.email || errors.general
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  getTranslation("emailPlaceholder", language) ||
                  "Enter your email"
                }
                disabled={isPending}
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {getTranslation("password", language) || "Password"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoMdLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  // Clear password and general errors when user starts typing
                  if (errors.password || errors.general) {
                    setErrors((prev) => ({
                      ...prev,
                      password: undefined,
                      general: undefined,
                    }));
                  }
                }}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.password || errors.general
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  getTranslation("passwordPlaceholder", language) ||
                  "Enter your password"
                }
                disabled={isPending}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isPending}
              >
                {showPassword ? (
                  <IoMdEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <IoMdEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <Link
              href="/forget-password"
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {getTranslation("forgotPassword", language) || "Forgot password?"}
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isPending ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {getTranslation("signingIn", language) || "Signing in..."}
              </span>
            ) : (
              getTranslation("signIn", language) || "Sign In"
            )}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getTranslation("dontHaveAccount", language) ||
              "Don't have an account?"}{" "}
            <Link
              href="/sign-up"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              {getTranslation("signUp", language) || "Sign Up"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SigninPage;
