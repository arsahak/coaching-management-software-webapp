import { LanguageProvider } from "@/lib/LanguageContext";
import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Coaching Center - Authentication",
  description: "Coaching Center Authentication",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LanguageProvider>
      {/* Simple auth layout - no sidebar or topbar; uses root html/body from main layout */}
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </LanguageProvider>
  );
}
