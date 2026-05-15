"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type NotificationType =
  | "admission"
  | "attendance"
  | "exam"
  | "fee_paid"
  | "fee_reminder"
  | "fee_overdue"
  | "sms_failed"
  | "system";

export interface Notification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  meta?: {
    admissionId?: string;
    studentName?: string;
    studentId?: string;
    relatedId?: string;
    smsSent?: boolean;
    smsNumbers?: string[];
  };
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data?: Notification[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount?: number;
  error?: string;
}

async function getToken() {
  const session = await auth();
  return (session as any)?.accessToken as string | undefined;
}

/** Fetch paginated notifications */
export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}): Promise<NotificationsResponse> {
  try {
    const token = await getToken();
    const qs = new URLSearchParams();
    if (params?.page)       qs.set("page",       String(params.page));
    if (params?.limit)      qs.set("limit",      String(params.limit));
    if (params?.unreadOnly) qs.set("unreadOnly", "true");
    if (params?.type)       qs.set("type",       params.type);

    const res = await fetch(`${API_URL}/api/notifications?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to load notifications" };
  }
}

/** Unread count only (lightweight — used for bell badge) */
export async function getUnreadCount(): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to get count" };
  }
}

/** Mark one notification as read */
export async function markNotificationRead(id: string): Promise<{ success: boolean }> {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}

/** Mark all as read */
export async function markAllNotificationsRead(): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/notifications/mark-all-read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}

/** Delete one notification */
export async function deleteNotification(id: string): Promise<{ success: boolean }> {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/notifications/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}

/** Clear all read notifications */
export async function clearReadNotifications(): Promise<{ success: boolean; message?: string }> {
  try {
    const token = await getToken();
    const res = await fetch(`${API_URL}/api/notifications/clear-read`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    return await res.json();
  } catch {
    return { success: false };
  }
}
