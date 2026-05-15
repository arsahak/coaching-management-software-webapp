"use client";

import {
  deleteInquiry,
  getInquiries,
  getInquiryStats,
  updateInquiry,
  type Inquiry,
  type InquiryStats,
  type InquiryStatus,
} from "@/app/actions/inquiry";
import GlobalLoading from "@/component/ui/GlobalLoading";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { FaSearch, FaTrash, FaUserPlus } from "react-icons/fa";

const STATUS_OPTIONS: InquiryStatus[] = [
  "pending",
  "contacted",
  "enrolled",
  "rejected",
];

interface InquiryManagementProps {
  initialData: Inquiry[];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  initialSearch?: string;
  initialStatus?: InquiryStatus | "";
  initialStats?: InquiryStats;
}

export default function InquiryManagement({
  initialData,
  initialPagination,
  initialSearch = "",
  initialStatus = "",
  initialStats,
}: InquiryManagementProps) {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const t = (key: string) => getTranslation(key, language);

  const [inquiries, setInquiries] = useState(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [stats, setStats] = useState<InquiryStats | undefined>(initialStats);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [editStatus, setEditStatus] = useState<InquiryStatus>("pending");
  const [editNotes, setEditNotes] = useState("");

  const updateURL = (params: Record<string, string>) => {
    startTransition(() => {
      const current = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value) current.set(key, value);
        else current.delete(key);
      });
      router.push(`/admission-inquiry?${current.toString()}`);
    });
  };

  const { debouncedCallback: debouncedSearch } = useDebounce((value: string) => {
    updateURL({ search: value, page: "1" });
  }, 500);

  const refreshStats = useCallback(async () => {
    const result = await getInquiryStats();
    if (result.success && result.data) setStats(result.data);
  }, []);

  const refreshData = useCallback(async () => {
    startTransition(async () => {
      const page = parseInt(searchParams.get("page") || "1", 10);
      const limit = parseInt(searchParams.get("limit") || "10", 10);
      const result = await getInquiries(
        page,
        limit,
        search,
        statusFilter || undefined
      );
      if (result.success && result.data) {
        setInquiries(result.data);
        setPagination(result.pagination);
      } else if (result.error) {
        toast.error(result.error);
      }
      await refreshStats();
    });
  }, [searchParams, search, statusFilter, refreshStats]);

  useEffect(() => {
    setInquiries(initialData);
    setPagination(initialPagination);
  }, [initialData, initialPagination]);

  const openDetail = (inquiry: Inquiry) => {
    setSelected(inquiry);
    setEditStatus(inquiry.status);
    setEditNotes(inquiry.adminNotes || "");
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value as InquiryStatus | "");
    updateURL({ status: value, page: "1" });
  };

  const handleSave = async () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await updateInquiry(selected._id, {
        status: editStatus,
        adminNotes: editNotes,
      });
      if (result.success) {
        toast.success(t("inquiryUpdateSuccess"));
        setSelected(null);
        refreshData();
      } else {
        toast.error(result.error || t("inquiryUpdateError"));
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDeleteInquiry"))) return;
    startTransition(async () => {
      const result = await deleteInquiry(id);
      if (result.success) {
        toast.success(t("inquiryDeleteSuccess"));
        if (selected?._id === id) setSelected(null);
        refreshData();
      } else {
        toast.error(result.error || t("inquiryDeleteError"));
      }
    });
  };

  const statusBadge = (status: InquiryStatus) => {
    const colors: Record<InquiryStatus, string> = {
      pending:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
      contacted:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
      enrolled:
        "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
      rejected:
        "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
    };
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[status]}`}
      >
        {t(`inquiryStatus_${status}`)}
      </span>
    );
  };

  if (isPending && inquiries.length === 0) {
    return <GlobalLoading variant="content" titleKey="loadingInquiries" />;
  }

  const card = isDarkMode ? "bg-gray-800" : "bg-white";
  const text = isDarkMode ? "text-gray-100" : "text-gray-900";
  const muted = isDarkMode ? "text-gray-400" : "text-gray-600";
  const input = isDarkMode
    ? "bg-gray-700 text-white border-gray-600"
    : "bg-white text-gray-900 border-gray-300";

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="p-6">
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${text}`}>{t("admissionInquiry")}</h1>
          <p className={`mt-1 text-sm ${muted}`}>{t("manageAdmissionInquiries")}</p>
        </div>

        {stats && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(
              [
                ["total", stats.total],
                ["pending", stats.pending],
                ["contacted", stats.contacted],
                ["enrolled", stats.enrolled],
                ["rejected", stats.rejected],
              ] as const
            ).map(([key, value]) => (
              <div key={key} className={`rounded-xl p-4 shadow-md ${card}`}>
                <p className={`text-xs font-medium uppercase ${muted}`}>
                  {t(`inquiryStat_${key}`)}
                </p>
                <p className={`mt-1 text-2xl font-bold ${text}`}>{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className={`mb-6 rounded-xl p-4 shadow-md ${card}`}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
              <FaSearch
                className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${muted}`}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                placeholder={t("inquirySearchPlaceholder")}
                className={`w-full rounded-lg border py-2.5 pl-10 pr-4 ${input}`}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className={`rounded-lg border px-4 py-2.5 ${input}`}
            >
              <option value="">{t("allStatuses")}</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {t(`inquiryStatus_${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`overflow-hidden rounded-xl shadow-md ${card}`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead
                className={
                  isDarkMode
                    ? "bg-gray-700/50 text-gray-300"
                    : "bg-gray-50 text-gray-600"
                }
              >
                <tr>
                  <th className="px-4 py-3 font-semibold">{t("date")}</th>
                  <th className="px-4 py-3 font-semibold">{t("studentName")}</th>
                  <th className="px-4 py-3 font-semibold">{t("parentName")}</th>
                  <th className="px-4 py-3 font-semibold">{t("phone")}</th>
                  <th className="px-4 py-3 font-semibold">{t("class")}</th>
                  <th className="px-4 py-3 font-semibold">{t("status")}</th>
                  <th className="px-4 py-3 font-semibold">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`px-4 py-12 text-center ${muted}`}>
                      {t("noInquiries")}
                    </td>
                  </tr>
                ) : (
                  inquiries.map((row) => (
                    <tr
                      key={row._id}
                      className={
                        isDarkMode
                          ? "border-t border-gray-700 hover:bg-gray-700/30"
                          : "border-t border-gray-100 hover:bg-gray-50"
                      }
                    >
                      <td className={`px-4 py-3 ${muted}`}>
                        {new Date(row.createdAt).toLocaleDateString(
                          language === "bn" ? "bn-BD" : "en-GB"
                        )}
                      </td>
                      <td className={`px-4 py-3 font-medium ${text}`}>
                        {row.studentName}
                      </td>
                      <td className={`px-4 py-3 ${text}`}>{row.parentName}</td>
                      <td className={`px-4 py-3 ${text}`}>{row.phone}</td>
                      <td className={`px-4 py-3 ${text}`}>{row.desiredClass}</td>
                      <td className="px-4 py-3">{statusBadge(row.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openDetail(row)}
                            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                          >
                            {t("view")}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row._id)}
                            className="rounded-lg bg-red-600/90 px-2 py-1.5 text-white hover:bg-red-600"
                            aria-label={t("delete")}
                          >
                            <FaTrash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div
              className={`flex items-center justify-between border-t px-4 py-3 ${
                isDarkMode ? "border-gray-700" : "border-gray-100"
              }`}
            >
              <button
                type="button"
                disabled={!pagination.hasPrev}
                onClick={() => updateURL({ page: String(pagination.page - 1) })}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              >
                {t("previous")}
              </button>
              <span className={`text-sm ${muted}`}>
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                type="button"
                disabled={!pagination.hasNext}
                onClick={() => updateURL({ page: String(pagination.page + 1) })}
                className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-40"
              >
                {t("next")}
              </button>
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div
            className={`max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl p-6 shadow-xl ${card}`}
          >
            <h2 className={`text-xl font-bold ${text}`}>{t("inquiryDetails")}</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className={`font-medium ${muted}`}>{t("studentName")}</dt>
                <dd className={text}>{selected.studentName}</dd>
              </div>
              <div>
                <dt className={`font-medium ${muted}`}>{t("parentName")}</dt>
                <dd className={text}>{selected.parentName}</dd>
              </div>
              <div>
                <dt className={`font-medium ${muted}`}>{t("phone")}</dt>
                <dd className={text}>{selected.phone}</dd>
              </div>
              {selected.email && (
                <div>
                  <dt className={`font-medium ${muted}`}>{t("email")}</dt>
                  <dd className={text}>{selected.email}</dd>
                </div>
              )}
              <div>
                <dt className={`font-medium ${muted}`}>{t("class")}</dt>
                <dd className={text}>{selected.desiredClass}</dd>
              </div>
              {selected.message && (
                <div>
                  <dt className={`font-medium ${muted}`}>{t("message")}</dt>
                  <dd className={text}>{selected.message}</dd>
                </div>
              )}
            </dl>

            <div className="mt-4 space-y-3">
              <label className={`block text-sm font-medium ${text}`}>
                {t("status")}
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(e.target.value as InquiryStatus)
                  }
                  className={`mt-1 w-full rounded-lg border px-3 py-2 ${input}`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {t(`inquiryStatus_${s}`)}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`block text-sm font-medium ${text}`}>
                {t("adminNotes")}
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  className={`mt-1 w-full rounded-lg border px-3 py-2 ${input}`}
                />
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              >
                {t("save")}
              </button>
              <button
                type="button"
                onClick={() => router.push("/admission/new-admission")}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-4 py-2 text-sm font-medium text-indigo-600"
              >
                <FaUserPlus />
                {t("createAdmission")}
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className={`rounded-lg border px-4 py-2 text-sm ${input}`}
              >
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

