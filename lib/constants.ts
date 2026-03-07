/**
 * API Configuration
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Application Configuration
 */
export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME || "Coaching Center System";
export const APP_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

/**
 * Feature Flags
 */
export const ENABLE_ANALYTICS =
  process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true";
export const ENABLE_DEBUG =
  process.env.NEXT_PUBLIC_ENABLE_DEBUG === "true";

/**
 * Validation Patterns
 */
export const PHONE_REGEX = /^01[3-9]\d{8}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN_LENGTH = 6;

/**
 * Predefined Classes for Admission
 */
export const PREDEFINED_CLASSES = [
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "SSC",
  "HSC",
  "Honours",
];

/**
 * Predefined Subjects
 */
export const PREDEFINED_SUBJECTS = [
  "Mathematics",
  "English",
  "Bengali",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "ICT",
  "History",
  "Geography",
  "Accounting",
  "Business Studies",
];

/**
 * Exam Types
 */
export const EXAM_TYPES = [
  { value: "quiz", label: "Quiz" },
  { value: "midterm", label: "Midterm" },
  { value: "final", label: "Final" },
  { value: "assignment", label: "Assignment" },
  { value: "other", label: "Other" },
] as const;

/**
 * Status Options
 */
export const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;

/**
 * Pagination
 */
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

/**
 * Date Formats
 */
export const DATE_FORMAT = "yyyy-MM-dd";
export const DATETIME_FORMAT = "yyyy-MM-dd HH:mm";
export const DISPLAY_DATE_FORMAT = "MMM dd, yyyy";
export const DISPLAY_DATETIME_FORMAT = "MMM dd, yyyy hh:mm a";

/**
 * Toast Configuration
 */
export const TOAST_DURATION = 3000; // 3 seconds
export const TOAST_SUCCESS_DURATION = 2000; // 2 seconds
export const TOAST_ERROR_DURATION = 4000; // 4 seconds

/**
 * API Timeouts
 */
export const API_TIMEOUT = 30000; // 30 seconds
export const API_RETRY_COUNT = 3;

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  THEME: "theme",
  LANGUAGE: "language",
  SIDEBAR_STATE: "sidebarState",
  USER_PREFERENCES: "userPreferences",
} as const;

/**
 * Grade Boundaries (can be customized)
 */
export const GRADE_BOUNDARIES = [
  { grade: "A+", min: 80, max: 100 },
  { grade: "A", min: 70, max: 79 },
  { grade: "A-", min: 60, max: 69 },
  { grade: "B", min: 50, max: 59 },
  { grade: "C", min: 40, max: 49 },
  { grade: "D", min: 33, max: 39 },
  { grade: "F", min: 0, max: 32 },
] as const;

/**
 * Currency Configuration
 */
export const DEFAULT_CURRENCY = "BDT";
export const CURRENCY_SYMBOL = "৳";

/**
 * Image Configuration
 */
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * SMS Configuration
 */
export const SMS_MAX_LENGTH = 160;
export const SMS_UNICODE_MAX_LENGTH = 70;
