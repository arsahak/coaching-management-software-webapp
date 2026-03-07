/**
 * Frontend validation utilities
 */

/**
 * Validates Bangladesh phone number format
 * Format: 01XXXXXXXXX (11 digits)
 */
export const validatePhoneNumber = (phone: string): boolean => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\s+/g, "").replace(/[()-]/g, "");
  return /^01[0-9]{9}$/.test(cleanPhone);
};

/**
 * Formats phone number for display
 * Example: 01712345678 -> 01712-345678
 */
export const formatPhoneNumber = (phone: string): string => {
  const cleanPhone = phone.replace(/\s+/g, "").replace(/[()-]/g, "");
  if (cleanPhone.length === 11) {
    return `${cleanPhone.substring(0, 5)}-${cleanPhone.substring(5)}`;
  }
  return cleanPhone;
};

/**
 * Validates email format
 */
export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates if a number is positive
 */
export const isPositiveNumber = (num: any): boolean => {
  const parsed = Number(num);
  return !isNaN(parsed) && parsed > 0;
};

/**
 * Validates date is not in the future
 */
export const isValidPastDate = (date: Date | string): boolean => {
  const dateObj = new Date(date);
  return dateObj <= new Date();
};

/**
 * Get phone number error message
 */
export const getPhoneErrorMessage = (language: string = "en"): string => {
  return language === "bn"
    ? "সঠিক মোবাইল নম্বর লিখুন (০১XXXXXXXXX)"
    : "Invalid phone number. Format: 01XXXXXXXXX";
};

/**
 * Get required field error message
 */
export const getRequiredErrorMessage = (language: string = "en"): string => {
  return language === "bn" ? "এই ক্ষেত্রটি আবশ্যক" : "This field is required";
};
