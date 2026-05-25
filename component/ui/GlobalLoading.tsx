"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";

type GlobalLoadingProps = {
  variant?: "fullscreen" | "content";
  titleKey?: string;
  subtitleKey?: string;
  embedded?: boolean;
};

export default function GlobalLoading({
  variant = "fullscreen",
  titleKey = "loading",
  subtitleKey = "loadingApp",
  embedded = false,
}: GlobalLoadingProps) {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const t = (key: string) => getTranslation(key, language);
  const isFullscreen = variant === "fullscreen";

  const heightClass = embedded
    ? "py-16 w-full"
    : isFullscreen
      ? "min-h-screen w-full"
      : "min-h-[calc(100vh-5rem)] w-full";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex flex-col items-center justify-center ${heightClass} ${
        embedded ? "" : isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="relative flex flex-col items-center gap-5 px-6">
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
              isDarkMode ? "bg-indigo-500" : "bg-blue-400"
            }`}
          />
          <div
            className={`relative h-14 w-14 rounded-full border-[3px] border-t-transparent animate-spin ${
              isDarkMode ? "border-indigo-400" : "border-blue-600"
            }`}
          />
        </div>

        <div className="text-center space-y-1">
          <p
            className={`text-base font-semibold tracking-tight ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {t(titleKey)}
          </p>
          <p className={`text-sm max-w-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            {t(subtitleKey)}
          </p>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`h-2 w-2 rounded-full animate-bounce ${
                isDarkMode ? "bg-indigo-400" : "bg-blue-600"
              }`}
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
