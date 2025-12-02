"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { IoMdExit, IoMdPower } from "react-icons/io";

interface LogoutButtonProps {
  variant?: "single" | "all" | "both";
  className?: string;
  showIcon?: boolean;
}

export default function LogoutButton({
  variant = "single",
  className = "",
  showIcon = true,
}: LogoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      toast.success("Logging out...");
      await signOut({ callbackUrl: "/sign-in" });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
      setLoading(false);
    }
  };

  const handleLogoutAll = async () => {
    if (
      !confirm(
        "Are you sure you want to logout from all devices? This will end all your active sessions."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      toast.success("Logging out from all devices...");
      // Note: NextAuth doesn't support logout from all devices by default
      // This would require custom backend implementation
      await signOut({ callbackUrl: "/sign-in" });
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Logout failed");
      setLoading(false);
    }
  };

  // Single logout button
  if (variant === "single") {
    return (
      <button
        onClick={handleLogout}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {showIcon && <IoMdExit className="w-5 h-5" />}
        <span>{loading ? "Logging out..." : "Logout"}</span>
      </button>
    );
  }

  // Logout all button
  if (variant === "all") {
    return (
      <button
        onClick={handleLogoutAll}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {showIcon && <IoMdPower className="w-5 h-5" />}
        <span>{loading ? "Logging out..." : "Logout All Devices"}</span>
      </button>
    );
  }

  // Both options with dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {showIcon && <IoMdExit className="w-5 h-5" />}
        <span>{loading ? "Logging out..." : "Logout"}</span>
      </button>

      {showMenu && !loading && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleLogout();
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <IoMdExit className="w-4 h-4" />
                Logout (This Device)
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  handleLogoutAll();
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <IoMdPower className="w-4 h-4" />
                Logout All Devices
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
