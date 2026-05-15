"use client";

import {
  clearReadNotifications,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type Notification,
} from "@/app/actions/notifications";
import { useSidebar } from "@/lib/SidebarContext";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FaBell,
  FaCheck,
  FaCheckDouble,
  FaSpinner,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

// ── icon + color per notification type ────────────────────────────────────────
const TYPE_CONFIG: Record<
  string,
  { emoji: string; dotColor: string; bgColor: string }
> = {
  admission:    { emoji: "🎓", dotColor: "bg-blue-500",   bgColor: "bg-blue-50 dark:bg-blue-900/20" },
  attendance:   { emoji: "📋", dotColor: "bg-green-500",  bgColor: "bg-green-50 dark:bg-green-900/20" },
  exam:         { emoji: "📝", dotColor: "bg-purple-500", bgColor: "bg-purple-50 dark:bg-purple-900/20" },
  fee_paid:     { emoji: "💰", dotColor: "bg-emerald-500", bgColor: "bg-emerald-50 dark:bg-emerald-900/20" },
  fee_reminder: { emoji: "🔔", dotColor: "bg-yellow-500", bgColor: "bg-yellow-50 dark:bg-yellow-900/20" },
  fee_overdue:  { emoji: "⚠️", dotColor: "bg-red-500",    bgColor: "bg-red-50 dark:bg-red-900/20" },
  sms_failed:   { emoji: "❌", dotColor: "bg-red-500",    bgColor: "bg-red-50 dark:bg-red-900/20" },
  system:       { emoji: "🔧", dotColor: "bg-gray-500",   bgColor: "bg-gray-50 dark:bg-gray-700/30" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── POLL interval (ms) ────────────────────────────────────────────────────────
const POLL_MS = 30_000;

export default function NotificationBell() {
  const { isDarkMode } = useSidebar();

  const [open,        setOpen]        = useState(false);
  const [unread,      setUnread]      = useState(0);
  const [items,       setItems]       = useState<Notification[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [filter,      setFilter]      = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Fetch unread count ──────────────────────────────────────────────────────
  const refreshCount = useCallback(async () => {
    const res = await getUnreadCount();
    if (res.success && res.count !== undefined) setUnread(res.count);
  }, []);

  // ── Fetch notification list ─────────────────────────────────────────────────
  const loadItems = useCallback(async () => {
    setLoading(true);
    const res = await getNotifications({
      limit: 30,
      unreadOnly: filter === "unread",
    });
    if (res.success && res.data) setItems(res.data);
    if (res.unreadCount !== undefined) setUnread(res.unreadCount);
    setLoading(false);
  }, [filter]);

  // Poll for unread count
  useEffect(() => {
    refreshCount();
    const id = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(id);
  }, [refreshCount]);

  // Reload when panel opens or filter changes
  useEffect(() => {
    if (open) loadItems();
  }, [open, loadItems]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleMarkOne = async (id: string) => {
    await markNotificationRead(id);
    setItems((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnread((c) => Math.max(0, c - 1));
  };

  const handleMarkAll = async () => {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  };

  const handleDelete = async (id: string) => {
    const item = items.find((n) => n._id === id);
    await deleteNotification(id);
    setItems((prev) => prev.filter((n) => n._id !== id));
    if (item && !item.isRead) setUnread((c) => Math.max(0, c - 1));
  };

  const handleClearRead = async () => {
    await clearReadNotifications();
    setItems((prev) => prev.filter((n) => !n.isRead));
  };

  const visible = filter === "unread" ? items.filter((n) => !n.isRead) : items;

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`relative p-2 rounded-lg transition-colors ${
          isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-50"
        }`}
        title="Notifications"
      >
        <FaBell
          className={`w-5 h-5 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Drop-down panel */}
      {open && (
        <div
          className={`absolute right-0 mt-2 w-96 rounded-xl shadow-2xl border overflow-hidden z-50 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-3 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
          >
            <div className="flex items-center gap-2">
              <FaBell className={isDarkMode ? "text-blue-400" : "text-blue-500"} />
              <span className={`font-semibold text-sm ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                Notifications
              </span>
              {unread > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  title="Mark all as read"
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    isDarkMode
                      ? "text-blue-400 hover:bg-gray-700"
                      : "text-blue-500 hover:bg-blue-50"
                  }`}
                >
                  <FaCheckDouble />
                </button>
              )}
              <button
                onClick={handleClearRead}
                title="Clear read notifications"
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isDarkMode
                    ? "text-gray-500 hover:bg-gray-700"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <FaTrash />
              </button>
              <button
                onClick={() => setOpen(false)}
                className={`p-1.5 rounded-lg text-xs transition-colors ${
                  isDarkMode
                    ? "text-gray-500 hover:bg-gray-700"
                    : "text-gray-400 hover:bg-gray-50"
                }`}
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Filter pills */}
          <div
            className={`flex gap-1 px-3 py-2 border-b ${
              isDarkMode ? "border-gray-700" : "border-gray-100"
            }`}
          >
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                  filter === f
                    ? isDarkMode
                      ? "bg-blue-600 text-white"
                      : "bg-blue-500 text-white"
                    : isDarkMode
                    ? "text-gray-400 hover:bg-gray-700"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <FaSpinner
                  className={`animate-spin text-xl ${isDarkMode ? "text-blue-400" : "text-blue-500"}`}
                />
              </div>
            ) : visible.length === 0 ? (
              <div
                className={`text-center py-12 text-sm ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                <FaBell className="mx-auto text-2xl mb-2 opacity-30" />
                {filter === "unread" ? "No unread notifications" : "No notifications yet"}
              </div>
            ) : (
              visible.map((n) => {
                const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.system;
                return (
                  <div
                    key={n._id}
                    className={`group flex items-start gap-3 px-4 py-3 transition-colors border-b last:border-0 ${
                      !n.isRead
                        ? isDarkMode
                          ? "bg-blue-900/10 border-gray-700"
                          : "bg-blue-50/60 border-gray-100"
                        : isDarkMode
                        ? "border-gray-700/50 hover:bg-gray-700/30"
                        : "border-gray-50 hover:bg-gray-50"
                    }`}
                  >
                    {/* Emoji avatar */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${cfg.bgColor}`}
                    >
                      {cfg.emoji}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isDarkMode ? "text-gray-100" : "text-gray-800"
                        }`}
                      >
                        {n.title}
                      </p>
                      <p
                        className={`text-xs mt-0.5 line-clamp-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        {n.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`text-[10px] ${
                            isDarkMode ? "text-gray-600" : "text-gray-400"
                          }`}
                        >
                          {timeAgo(n.createdAt)}
                        </span>
                        {n.meta?.smsSent !== undefined && (
                          <span
                            className={`text-[10px] font-medium ${
                              n.meta.smsSent
                                ? isDarkMode ? "text-green-400" : "text-green-600"
                                : isDarkMode ? "text-red-400" : "text-red-500"
                            }`}
                          >
                            {n.meta.smsSent ? "SMS sent" : "SMS failed"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.isRead && (
                        <button
                          onClick={() => handleMarkOne(n._id)}
                          title="Mark as read"
                          className={`p-1.5 rounded-lg text-xs transition-colors ${
                            isDarkMode
                              ? "text-blue-400 hover:bg-gray-700"
                              : "text-blue-500 hover:bg-blue-50"
                          }`}
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(n._id)}
                        title="Delete"
                        className={`p-1.5 rounded-lg text-xs transition-colors ${
                          isDarkMode
                            ? "text-red-400 hover:bg-gray-700"
                            : "text-red-400 hover:bg-red-50"
                        }`}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {visible.length > 0 && (
            <div
              className={`px-4 py-2.5 text-center border-t ${
                isDarkMode ? "border-gray-700" : "border-gray-100"
              }`}
            >
              <button
                onClick={loadItems}
                className={`text-xs font-medium transition-colors ${
                  isDarkMode
                    ? "text-blue-400 hover:text-blue-300"
                    : "text-blue-500 hover:text-blue-600"
                }`}
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
