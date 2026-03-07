import { auth } from "@/auth";

/**
 * Get authentication headers for API requests
 * @returns Headers object with Content-Type and Authorization
 */
export async function getAuthHeaders() {
  const session = await auth();
  return {
    "Content-Type": "application/json",
    ...(session?.accessToken && {
      Authorization: `Bearer ${session.accessToken}`,
    }),
  };
}

/**
 * Format currency amount
 * @param amount - The amount to format
 * @param currency - Currency code (default: BDT)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = "BDT"): string {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date in readable format
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted date string
 */
export function formatDate(date: string | Date, locale = "en-US"): string {
  return new Date(date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format date and time
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-US)
 * @returns Formatted date and time string
 */
export function formatDateTime(date: string | Date, locale = "en-US"): string {
  return new Date(date).toLocaleString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Class name utility for conditional classes
 * @param classes - Array of class names (can include undefined/false)
 * @returns Combined class string
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param length - Maximum length (default: 50)
 * @returns Truncated text with ellipsis
 */
export function truncate(text: string, length = 50): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + "...";
}

/**
 * Debounce function execution
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Check if value is empty (null, undefined, empty string, empty array, empty object)
 * @param value - Value to check
 * @returns True if empty
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}

/**
 * Generate random ID
 * @returns Random alphanumeric ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Sleep/delay function
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
