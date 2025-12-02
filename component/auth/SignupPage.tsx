"use client";

import { userSignUp } from "@/app/actions/auth";
import { useLanguage } from "@/lib/LanguageContext";
import { getTranslation } from "@/lib/translations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  IoMdEye,
  IoMdEyeOff,
  IoMdLock,
  IoMdMail,
  IoMdPerson,
} from "react-icons/io";

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const { language } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name =
        getTranslation("nameRequired", language) || "Name is required";
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword =
        getTranslation("confirmPasswordRequired", language) ||
        "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        getTranslation("passwordsDoNotMatch", language) ||
        "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (formData: FormData) => {
    if (!validateForm()) {
      return;
    }

    setErrors({});

    startTransition(async () => {
      const result = await userSignUp(formData);

      if (result.error) {
        toast.error(
          result.error ||
            getTranslation("signupFailed", language) ||
            "Sign up failed"
        );
      } else {
        toast.success(
          getTranslation("signupSuccessful", language) ||
            "Account created successfully!"
        );
        router.push("/sign-in");
      }
    });
  };

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getTranslation("signUp", language) || "Sign Up"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {getTranslation("createAccount", language) ||
              "Create your account to get started"}
          </p>
        </div>

        {/* Form */}
        <form action={handleSubmit} className="space-y-6">
          {/* Name Field */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {getTranslation("name", language) || "Name"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoMdPerson className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.name
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  getTranslation("namePlaceholder", language) ||
                  "Enter your full name"
                }
                disabled={isPending}
                required
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.name}
              </p>
            )}
          </div>

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
                onChange={(e) => setEmail(e.target.value)}
                className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.email
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  getTranslation("emailPlaceholder", language) ||
                  "Enter your email"
                }
                disabled={isPending}
                required
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
                onChange={(e) => setPassword(e.target.value)}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  getTranslation("passwordPlaceholder", language) ||
                  "Enter your password"
                }
                disabled={isPending}
                required
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

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {getTranslation("confirmPassword", language) ||
                "Confirm Password"}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <IoMdLock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                placeholder={
                  getTranslation("confirmPasswordPlaceholder", language) ||
                  "Confirm your password"
                }
                disabled={isPending}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                disabled={isPending}
              >
                {showConfirmPassword ? (
                  <IoMdEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                ) : (
                  <IoMdEye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors.confirmPassword}
              </p>
            )}
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
                {getTranslation("creatingAccount", language) ||
                  "Creating account..."}
              </span>
            ) : (
              getTranslation("signUp", language) || "Sign Up"
            )}
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getTranslation("alreadyHaveAccount", language) ||
              "Already have an account?"}{" "}
            <Link
              href="/sign-in"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
            >
              {getTranslation("signIn", language) || "Sign In"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
