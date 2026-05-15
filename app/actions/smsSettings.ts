"use server";

import { auth } from "@/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export type SMSSettingKey =
  | "admission"
  | "attendancePresent"
  | "attendanceAbsent"
  | "examScheduled"
  | "examResult"
  | "examAlert"
  | "feePaid"
  | "feeReminder"
  | "feeOverdue";

export interface SMSSetting {
  _id?: string;
  key: SMSSettingKey;
  enabled: boolean;
  message: string;
}

export interface SMSSettingsMap {
  [key: string]: SMSSetting;
}

/** Fetch all SMS settings */
export async function getSMSSettings(): Promise<{
  success: boolean;
  data?: SMSSettingsMap;
  error?: string;
}> {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;

    const res = await fetch(`${API_URL}/api/sms-settings`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    const json = await res.json();
    return json;
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to load settings" };
  }
}

/** Save all settings at once */
export async function saveSMSSettings(settings: Record<SMSSettingKey, { enabled: boolean; message: string }>): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const session = await auth();
    const token = (session as any)?.accessToken;

    const res = await fetch(`${API_URL}/api/sms-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings }),
    });

    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Failed to save settings" };
  }
}
