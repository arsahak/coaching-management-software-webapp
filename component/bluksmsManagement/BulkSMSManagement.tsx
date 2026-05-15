"use client";

import { getAdmissions } from "@/app/actions/admission";
import {
  getSMSHistory,
  getSMSStats,
  sendBulkSMS,
  sendBulkSMSCustom,
  sendSingleSMS,
  sendSMSToStudents,
} from "@/app/actions/sms";
import GlobalLoading from "@/component/ui/GlobalLoading";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import toast from "react-hot-toast";
import {
  FaChartBar,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaEnvelope,
  FaFileAlt,
  FaGraduationCap,
  FaHistory,
  FaLayerGroup,
  FaListUl,
  FaMobileAlt,
  FaPaperPlane,
  FaPlus,
  FaSearch,
  FaTimesCircle,
  FaTrash,
  FaUsers,
} from "react-icons/fa";

interface SMSRecord {
  _id: string;
  type: "single" | "bulk" | "exam" | "fee" | "attendance" | "custom";
  message: string;
  recipients: Array<{
    mobileNumber: string;
    name?: string;
    studentId?: string;
    status: "pending" | "sent" | "failed" | "delivered";
    sentAt?: string;
    error?: string;
  }>;
  senderId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: "pending" | "sent" | "failed" | "delivered";
  createdAt: string;
}

interface Admission {
  _id: string;
  studentName: string;
  fatherMobile: string;
  motherMobile?: string;
  studentId?: string;
  class: string;
  batchName: string;
}

type ViewMode = "send" | "history" | "stats";
type SendMode = "single" | "bulk" | "custom" | "students";

const APPROVED_SENDER_ID = "8809617634353";

export default function BulkSMSManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [isDataPending, startDataTransition] = useTransition();

  const [viewMode, setViewMode] = useState<ViewMode>("send");
  const [sendMode, setSendMode] = useState<SendMode>("single");

  const [singleForm, setSingleForm] = useState({
    mobileNumber: "",
    message: "",
    senderId: APPROVED_SENDER_ID,
  });

  const [bulkForm, setBulkForm] = useState({
    mobileNumbers: "",
    message: "",
    senderId: APPROVED_SENDER_ID,
  });

  const [customForm, setCustomForm] = useState<
    Array<{ number: string; message: string }>
  >([{ number: "", message: "" }]);

  const [studentsForm, setStudentsForm] = useState({
    message: "",
    class: "",
    batchName: "",
    senderId: APPROVED_SENDER_ID,
  });

  const HISTORY_PAGE_SIZE = 10;

  const [smsHistory, setSmsHistory] = useState<SMSRecord[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  const [historyFilters, setHistoryFilters] = useState<{
    type?: string;
    status?: string;
    search?: string;
  }>({});
  const [historySearchInput, setHistorySearchInput] = useState("");
  const [stats, setStats] = useState<{
    totalSMS: number;
    sentSMS: number;
    failedSMS: number;
    deliveredSMS: number;
    totalRecipients: number;
    totalSent: number;
    totalFailed: number;
  } | null>(null);

  const [allAdmissions, setAllAdmissions] = useState<Admission[]>([]);
  const [batchSearch, setBatchSearch] = useState("");
  const [showBatchDropdown, setShowBatchDropdown] = useState(false);
  const batchDropdownRef = useRef<HTMLDivElement>(null);

  const loadSMSHistory = (
    page: number,
    filters: { type?: string; status?: string; search?: string },
  ) => {
    startDataTransition(async () => {
      const result = await getSMSHistory(page, HISTORY_PAGE_SIZE, filters);
      if (result.success && result.data) {
        setSmsHistory(
          (Array.isArray(result.data) ? result.data : []) as SMSRecord[],
        );
        if (result.pagination) setHistoryPagination(result.pagination);
      }
    });
  };

  const loadStats = async () => {
    startDataTransition(async () => {
      const result = await getSMSStats();
      if (result.success && result.data) {
        setStats(result.data as typeof stats);
      }
    });
  };

  const loadAdmissions = async () => {
    startDataTransition(async () => {
      const result = await getAdmissions(1, 2000, "", { status: "active" });
      if (result.success && result.data) {
        setAllAdmissions(
          (Array.isArray(result.data) ? result.data : []) as Admission[],
        );
      }
    });
  };

  // Derived: unique classes present in admissions data
  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();
    allAdmissions.forEach((a) => {
      if (a.class) seen.add(a.class);
    });
    return Array.from(seen).sort((a, b) => {
      const na = parseInt(a.replace(/\D/g, ""), 10);
      const nb = parseInt(b.replace(/\D/g, ""), 10);
      return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
    });
  }, [allAdmissions]);

  // Derived: unique batches for the selected class (or all if no class selected)
  const uniqueBatches = useMemo(() => {
    const pool = studentsForm.class
      ? allAdmissions.filter((a) => a.class === studentsForm.class)
      : allAdmissions;
    const seen = new Set<string>();
    pool.forEach((a) => {
      if (a.batchName) seen.add(a.batchName);
    });
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [allAdmissions, studentsForm.class]);

  // Derived: batches filtered by search input
  const filteredBatches = useMemo(() => {
    if (!batchSearch.trim()) return uniqueBatches;
    return uniqueBatches.filter((b) =>
      b.toLowerCase().includes(batchSearch.toLowerCase()),
    );
  }, [uniqueBatches, batchSearch]);

  // Derived: student count matching current filters (client-side)
  const filteredStudentCount = useMemo(() => {
    return allAdmissions.filter((a) => {
      if (studentsForm.class && a.class !== studentsForm.class) return false;
      if (studentsForm.batchName && a.batchName !== studentsForm.batchName)
        return false;
      return true;
    }).length;
  }, [allAdmissions, studentsForm.class, studentsForm.batchName]);

  // Debounce search input → historyFilters.search (reset to page 1 on new search)
  useEffect(() => {
    const id = setTimeout(() => {
      setHistoryPage(1);
      setHistoryFilters((f) => ({
        ...f,
        search: historySearchInput.trim() || undefined,
      }));
    }, 400);
    return () => clearTimeout(id);
  }, [historySearchInput]);

  useEffect(() => {
    if (viewMode === "history") loadSMSHistory(historyPage, historyFilters);
  }, [viewMode, historyFilters, historyPage]);

  useEffect(() => {
    if (viewMode === "stats") loadStats();
  }, [viewMode]);
  useEffect(() => {
    if (sendMode === "students") loadAdmissions();
  }, [sendMode]);

  useEffect(() => {
    loadAdmissions();
  }, []);

  // Close batch dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        batchDropdownRef.current &&
        !batchDropdownRef.current.contains(e.target as Node)
      ) {
        setShowBatchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSendSingle = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await sendSingleSMS({
        mobileNumber: singleForm.mobileNumber,
        message: singleForm.message,
        senderId: singleForm.senderId,
      });
      if (result.success) {
        toast.success(
          result.message ||
            (language === "bn"
              ? "SMS সফলভাবে পাঠানো হয়েছে"
              : "SMS sent successfully"),
        );
        setSingleForm({ ...singleForm, mobileNumber: "", message: "" });
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "SMS পাঠাতে ব্যর্থ" : "Failed to send SMS"),
        );
      }
    });
  };

  const handleSendBulk = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const numbers = bulkForm.mobileNumbers
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean);
    startTransition(async () => {
      const result = await sendBulkSMS({
        mobileNumbers: numbers,
        message: bulkForm.message,
        senderId: bulkForm.senderId,
      });
      if (result.success) {
        toast.success(
          result.message ||
            (language === "bn"
              ? "Bulk SMS সফলভাবে পাঠানো হয়েছে"
              : "Bulk SMS sent successfully"),
        );
        setBulkForm({ ...bulkForm, mobileNumbers: "", message: "" });
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "Bulk SMS পাঠাতে ব্যর্থ"
              : "Failed to send bulk SMS"),
        );
      }
    });
  };

  const handleSendCustom = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validMessages = customForm.filter(
      (m) => m.number.trim() && m.message.trim(),
    );
    startTransition(async () => {
      const result = await sendBulkSMSCustom({ messages: validMessages });
      if (result.success) {
        toast.success(
          result.message ||
            (language === "bn"
              ? "SMS সফলভাবে পাঠানো হয়েছে"
              : "SMS sent successfully"),
        );
        setCustomForm([{ number: "", message: "" }]);
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "SMS পাঠাতে ব্যর্থ" : "Failed to send SMS"),
        );
      }
    });
  };

  const handleSendToStudents = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await sendSMSToStudents({
        message: studentsForm.message,
        filters: {
          class: studentsForm.class || undefined,
          batchName: studentsForm.batchName || undefined,
        },
        senderId: studentsForm.senderId,
      });
      if (result.success) {
        toast.success(
          result.message ||
            (language === "bn"
              ? "SMS সফলভাবে পাঠানো হয়েছে"
              : "SMS sent successfully"),
        );
        setStudentsForm({ ...studentsForm, message: "" });
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "SMS পাঠাতে ব্যর্থ" : "Failed to send SMS"),
        );
      }
    });
  };

  const addCustomMessageRow = () =>
    setCustomForm([...customForm, { number: "", message: "" }]);

  const removeCustomMessageRow = (index: number) =>
    setCustomForm(customForm.filter((_, i) => i !== index));

  const updateCustomMessage = (
    index: number,
    field: "number" | "message",
    value: string,
  ) => {
    const updated = [...customForm];
    updated[index] = { ...updated[index], [field]: value };
    setCustomForm(updated);
  };

  // ─── Shared class helpers ────────────────────────────────────────────────────

  const cardCls = `rounded-2xl shadow-sm border transition-colors duration-200 ${
    isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
  }`;

  const inputCls = `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
    isDarkMode
      ? "border-gray-600 bg-gray-700/60 text-white placeholder-gray-400"
      : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400"
  }`;

  const labelCls = `block text-xs font-semibold uppercase tracking-wide mb-1.5 ${
    isDarkMode ? "text-gray-400" : "text-gray-500"
  }`;

  const textCls = isDarkMode ? "text-gray-100" : "text-gray-900";
  const mutedCls = isDarkMode ? "text-gray-400" : "text-gray-500";

  const getStatusBadge = (status: string) => {
    const map: Record<
      string,
      { bg: string; text: string; icon: React.ElementType }
    > = {
      sent: {
        bg: "bg-emerald-100 dark:bg-emerald-900/40",
        text: "text-emerald-700 dark:text-emerald-300",
        icon: FaCheckCircle,
      },
      delivered: {
        bg: "bg-blue-100 dark:bg-blue-900/40",
        text: "text-blue-700 dark:text-blue-300",
        icon: FaCheckCircle,
      },
      failed: {
        bg: "bg-red-100 dark:bg-red-900/40",
        text: "text-red-700 dark:text-red-300",
        icon: FaTimesCircle,
      },
      pending: {
        bg: "bg-amber-100 dark:bg-amber-900/40",
        text: "text-amber-700 dark:text-amber-300",
        icon: FaTimesCircle,
      },
    };
    const s = map[status] || map.pending;
    const Icon = s.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // ─── Send mode tab config ─────────────────────────────────────────────────────

  const sendTabs: {
    key: SendMode;
    label: { en: string; bn: string };
    icon: React.ElementType;
    color: string;
  }[] = [
    {
      key: "single",
      label: { en: "Single SMS", bn: "একক SMS" },
      icon: FaMobileAlt,
      color: "blue",
    },
    {
      key: "bulk",
      label: { en: "Bulk (Same)", bn: "Bulk (একই)" },
      icon: FaLayerGroup,
      color: "violet",
    },
    {
      key: "custom",
      label: { en: "Bulk (Custom)", bn: "Bulk (ভিন্ন)" },
      icon: FaListUl,
      color: "indigo",
    },
    {
      key: "students",
      label: { en: "To Students", bn: "ছাত্রদের" },
      icon: FaGraduationCap,
      color: "teal",
    },
  ];

  const sendTabColor: Record<string, string> = {
    blue: "bg-blue-600 text-white shadow-blue-200",
    violet: "bg-violet-600 text-white shadow-violet-200",
    indigo: "bg-indigo-600 text-white shadow-indigo-200",
    teal: "bg-teal-600 text-white shadow-teal-200",
  };

  // ─── Submit button ────────────────────────────────────────────────────────────

  const SubmitBtn = ({
    icon: Icon,
    label,
    loadLabel,
    color = "blue",
  }: {
    icon: React.ElementType;
    label: string;
    loadLabel: string;
    color?: string;
  }) => {
    const gradients: Record<string, string> = {
      blue: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 shadow-blue-200",
      violet:
        "bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-700 hover:to-violet-600 shadow-violet-200",
      indigo:
        "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 shadow-indigo-200",
      teal: "bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-teal-200",
    };
    return (
      <button
        type="submit"
        disabled={isPending}
        className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${gradients[color] || gradients.blue}`}
      >
        <Icon className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
        {isPending ? loadLabel : label}
      </button>
    );
  };

  // ─── Sender ID field (reused) ─────────────────────────────────────────────────

  const SenderIdField = ({
    value,
    onChange,
  }: {
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div>
      <label className={labelCls}>Sender ID</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={APPROVED_SENDER_ID}
        className={inputCls}
      />
      <p className={`text-xs mt-1 ${mutedCls}`}>
        {language === "bn"
          ? "অনুমোদিত সেন্ডার আইডি ব্যবহার করুন"
          : "Use your approved sender ID"}
      </p>
    </div>
  );

  // ─── Character counter ────────────────────────────────────────────────────────

  const CharCounter = ({ text }: { text: string }) => {
    const len = text.length;
    const sms = Math.ceil(len / 160) || 1;
    const pct = Math.min((len % 160 || (len > 0 ? 160 : 0)) / 160, 1) * 100;
    return (
      <div className="mt-2 space-y-1">
        <div className="h-1 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-200"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className={`flex justify-between text-xs ${mutedCls}`}>
          <span>
            {len} {language === "bn" ? "অক্ষর" : "chars"}
          </span>
          <span>
            {sms} SMS {language === "bn" ? "ক্রেডিট" : "credit"}
            {sms > 1 ? "s" : ""}
          </span>
        </div>
      </div>
    );
  };

  // ─── View-level tab config ────────────────────────────────────────────────────

  const viewTabs: {
    key: ViewMode;
    label: { en: string; bn: string };
    icon: React.ElementType;
  }[] = [
    {
      key: "send",
      label: { en: "Send SMS", bn: "SMS পাঠান" },
      icon: FaPaperPlane,
    },
    { key: "history", label: { en: "History", bn: "ইতিহাস" }, icon: FaHistory },
    {
      key: "stats",
      label: { en: "Statistics", bn: "পরিসংখ্যান" },
      icon: FaChartBar,
    },
  ];

  if (
    isDataPending &&
    allAdmissions.length === 0 &&
    smsHistory.length === 0 &&
    stats === null
  ) {
    return (
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? "bg-gray-900" : "bg-slate-50"
        }`}
      >
        <GlobalLoading variant="content" titleKey="loadingBulkSms" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "bg-gray-900" : "bg-slate-50"
      }`}
    >
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        className={`px-6 pt-8 pb-6 border-b transition-colors duration-200 ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="flex items-center gap-4 mb-1">
          <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 shadow-lg shadow-blue-200/40">
            <FaEnvelope className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className={`text-2xl font-bold leading-tight ${textCls}`}>
              {language === "bn"
                ? "Bulk SMS ব্যবস্থাপনা"
                : "Bulk SMS Management"}
            </h1>
            <p className={`text-sm ${mutedCls}`}>
              {language === "bn"
                ? "বাল্ক এসএমএস পাঠান ও ইতিহাস পর্যালোচনা করুন"
                : "Send bulk messages and review delivery history"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* ── Top-level View Tabs ──────────────────────────────────────────── */}
        <div
          className={`inline-flex p-1 rounded-2xl gap-1 ${
            isDarkMode
              ? "bg-gray-800"
              : "bg-white shadow-sm border border-gray-200"
          }`}
        >
          {viewTabs.map(({ key, label, icon: Icon }) => {
            const active = viewMode === key;
            return (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-200/50"
                    : isDarkMode
                      ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {language === "bn" ? label.bn : label.en}
              </button>
            );
          })}
        </div>

        {/* ══ SEND VIEW ════════════════════════════════════════════════════ */}
        {viewMode === "send" && (
          <div className="space-y-5">
            {/* Send Mode Selector */}
            <div className={`${cardCls} p-5`}>
              <p
                className={`text-xs font-semibold uppercase tracking-widest mb-3 ${mutedCls}`}
              >
                {language === "bn"
                  ? "পাঠানোর ধরন বেছে নিন"
                  : "Select send type"}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sendTabs.map(({ key, label, icon: Icon, color }) => {
                  const active = sendMode === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSendMode(key)}
                      className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                        active
                          ? `${sendTabColor[color]} border-transparent shadow-lg`
                          : isDarkMode
                            ? "border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-200 bg-gray-700/40"
                            : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700 bg-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="leading-tight text-center">
                        {language === "bn" ? label.bn : label.en}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Single SMS Form ── */}
            {sendMode === "single" && (
              <form onSubmit={handleSendSingle} className={`${cardCls} p-6`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <FaMobileAlt className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className={`text-base font-bold ${textCls}`}>
                    {language === "bn" ? "একক SMS পাঠান" : "Send Single SMS"}
                  </h2>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>
                      {language === "bn" ? "মোবাইল নম্বর" : "Mobile Number"}{" "}
                      <span className="text-red-500 normal-case text-sm">
                        *
                      </span>
                    </label>
                    <input
                      type="text"
                      value={singleForm.mobileNumber}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          mobileNumber: e.target.value,
                        })
                      }
                      required
                      placeholder="88017XXXXXXXX"
                      className={inputCls}
                    />
                  </div>
                  <SenderIdField
                    value={singleForm.senderId}
                    onChange={(v) =>
                      setSingleForm({ ...singleForm, senderId: v })
                    }
                  />
                  <div className="md:col-span-2">
                    <label className={labelCls}>
                      {language === "bn" ? "বার্তা" : "Message"}{" "}
                      <span className="text-red-500 normal-case text-sm">
                        *
                      </span>
                    </label>
                    <textarea
                      value={singleForm.message}
                      onChange={(e) =>
                        setSingleForm({
                          ...singleForm,
                          message: e.target.value,
                        })
                      }
                      required
                      rows={5}
                      placeholder={
                        language === "bn"
                          ? "আপনার বার্তা লিখুন..."
                          : "Type your message..."
                      }
                      className={`${inputCls} resize-none`}
                    />
                    <CharCounter text={singleForm.message} />
                  </div>
                  <div className="md:col-span-2">
                    <SubmitBtn
                      icon={FaPaperPlane}
                      label={language === "bn" ? "SMS পাঠান" : "Send SMS"}
                      loadLabel={
                        language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."
                      }
                      color="blue"
                    />
                  </div>
                </div>
              </form>
            )}

            {/* ── Bulk SMS (Same Message) Form ── */}
            {sendMode === "bulk" && (
              <form onSubmit={handleSendBulk} className={`${cardCls} p-6`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <FaLayerGroup className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${textCls}`}>
                      {language === "bn"
                        ? "Bulk SMS (একই বার্তা)"
                        : "Bulk SMS — Same Message"}
                    </h2>
                    <p className={`text-xs ${mutedCls}`}>
                      {language === "bn"
                        ? "কমা বা নতুন লাইনে নম্বর আলাদা করুন"
                        : "Separate numbers by comma or newline"}
                    </p>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="grid md:grid-cols-3 gap-5">
                    <div className="md:col-span-2">
                      <label className={labelCls}>
                        {language === "bn"
                          ? "মোবাইল নম্বরসমূহ"
                          : "Mobile Numbers"}{" "}
                        <span className="text-red-500 normal-case text-sm">
                          *
                        </span>
                      </label>
                      <textarea
                        value={bulkForm.mobileNumbers}
                        onChange={(e) =>
                          setBulkForm({
                            ...bulkForm,
                            mobileNumbers: e.target.value,
                          })
                        }
                        required
                        rows={6}
                        placeholder={
                          "88017XXXXXXXX\n88018XXXXXXXX\n88019XXXXXXXX"
                        }
                        className={`${inputCls} resize-none font-mono`}
                      />
                      <p className={`text-xs mt-1 font-medium ${mutedCls}`}>
                        {
                          bulkForm.mobileNumbers
                            .split(/[,\n]/)
                            .filter((n) => n.trim()).length
                        }{" "}
                        {language === "bn" ? "টি নম্বর" : "numbers entered"}
                      </p>
                    </div>
                    <SenderIdField
                      value={bulkForm.senderId}
                      onChange={(v) =>
                        setBulkForm({ ...bulkForm, senderId: v })
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>
                      {language === "bn" ? "বার্তা" : "Message"}{" "}
                      <span className="text-red-500 normal-case text-sm">
                        *
                      </span>
                    </label>
                    <textarea
                      value={bulkForm.message}
                      onChange={(e) =>
                        setBulkForm({ ...bulkForm, message: e.target.value })
                      }
                      required
                      rows={5}
                      placeholder={
                        language === "bn"
                          ? "আপনার বার্তা লিখুন..."
                          : "Type your message..."
                      }
                      className={`${inputCls} resize-none`}
                    />
                    <CharCounter text={bulkForm.message} />
                  </div>
                  <SubmitBtn
                    icon={FaPaperPlane}
                    label={
                      language === "bn" ? "Bulk SMS পাঠান" : "Send Bulk SMS"
                    }
                    loadLabel={
                      language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."
                    }
                    color="violet"
                  />
                </div>
              </form>
            )}

            {/* ── Bulk SMS (Different Messages) Form ── */}
            {sendMode === "custom" && (
              <form onSubmit={handleSendCustom} className={`${cardCls} p-6`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                      <FaListUl className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <h2 className={`text-base font-bold ${textCls}`}>
                        {language === "bn"
                          ? "Bulk SMS (ভিন্ন বার্তা)"
                          : "Bulk SMS — Custom Messages"}
                      </h2>
                      <p className={`text-xs ${mutedCls}`}>
                        {customForm.length}{" "}
                        {language === "bn" ? "টি বার্তা" : "message(s)"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={addCustomMessageRow}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    <FaPlus className="w-3 h-3" />
                    {language === "bn" ? "যোগ করুন" : "Add Row"}
                  </button>
                </div>
                <div className="space-y-3 mb-5">
                  {customForm.map((msg, index) => (
                    <div
                      key={index}
                      className={`rounded-xl border p-4 transition-colors ${
                        isDarkMode
                          ? "border-gray-600 bg-gray-700/40"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-xs font-semibold uppercase tracking-wide ${mutedCls}`}
                        >
                          #{index + 1}
                        </span>
                        {customForm.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomMessageRow(index)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                          >
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div>
                          <label className={labelCls}>
                            {language === "bn" ? "নম্বর" : "Number"} *
                          </label>
                          <input
                            type="text"
                            value={msg.number}
                            onChange={(e) =>
                              updateCustomMessage(
                                index,
                                "number",
                                e.target.value,
                              )
                            }
                            required
                            placeholder="88017XXXXXXXX"
                            className={inputCls}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>
                            {language === "bn" ? "বার্তা" : "Message"} *
                          </label>
                          <textarea
                            value={msg.message}
                            onChange={(e) =>
                              updateCustomMessage(
                                index,
                                "message",
                                e.target.value,
                              )
                            }
                            required
                            rows={2}
                            placeholder={
                              language === "bn"
                                ? "বার্তা লিখুন..."
                                : "Enter message..."
                            }
                            className={`${inputCls} resize-none`}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <SubmitBtn
                  icon={FaPaperPlane}
                  label={language === "bn" ? "সব SMS পাঠান" : "Send All SMS"}
                  loadLabel={
                    language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."
                  }
                  color="indigo"
                />
              </form>
            )}

            {/* ── Send to Students Form ── */}
            {sendMode === "students" && (
              <form
                onSubmit={handleSendToStudents}
                className={`${cardCls} p-6`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center">
                    <FaGraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <h2 className={`text-base font-bold ${textCls}`}>
                      {language === "bn"
                        ? "ছাত্রদের কাছে SMS পাঠান"
                        : "Send SMS to Students"}
                    </h2>
                    <p className={`text-xs ${mutedCls}`}>
                      {language === "bn"
                        ? "শ্রেণি বা ব্যাচ অনুযায়ী ফিল্টার করুন"
                        : "Filter by class or batch"}
                    </p>
                  </div>
                </div>

                {/* Loading skeleton while admissions are fetching */}
                {isDataPending && allAdmissions.length === 0 ? (
                  <GlobalLoading embedded titleKey="loadingStudentData" />
                ) : (
                  <div className="space-y-5">
                    <div className="grid md:grid-cols-3 gap-5">
                      {/* Class — dynamic from admissions */}
                      <div>
                        <label className={labelCls}>
                          {language === "bn" ? "শ্রেণি" : "Class"}
                          {uniqueClasses.length > 0 && (
                            <span
                              className={`ml-1.5 normal-case font-normal ${mutedCls}`}
                            >
                              ({uniqueClasses.length})
                            </span>
                          )}
                        </label>
                        <select
                          value={studentsForm.class}
                          onChange={(e) => {
                            setStudentsForm({
                              ...studentsForm,
                              class: e.target.value,
                              batchName: "",
                            });
                            setBatchSearch("");
                          }}
                          className={inputCls}
                        >
                          <option value="">
                            {language === "bn"
                              ? "— সব শ্রেণি —"
                              : "— All Classes —"}
                          </option>
                          {uniqueClasses.map((cls) => (
                            <option key={cls} value={cls}>
                              {cls}
                            </option>
                          ))}
                        </select>
                        {uniqueClasses.length === 0 && !isDataPending && (
                          <p className={`text-xs mt-1 ${mutedCls}`}>
                            {language === "bn"
                              ? "কোনো শ্রেণি পাওয়া যায়নি"
                              : "No classes found"}
                          </p>
                        )}
                      </div>

                      {/* Batch — searchable dropdown */}
                      <div ref={batchDropdownRef} className="relative">
                        <label className={labelCls}>
                          {language === "bn" ? "ব্যাচ" : "Batch"}
                          {uniqueBatches.length > 0 && (
                            <span
                              className={`ml-1.5 normal-case font-normal ${mutedCls}`}
                            >
                              ({uniqueBatches.length})
                            </span>
                          )}
                        </label>
                        <div className="relative">
                          <FaSearch
                            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${mutedCls}`}
                          />
                          <input
                            type="text"
                            value={studentsForm.batchName || batchSearch}
                            onFocus={() => {
                              if (!studentsForm.batchName)
                                setShowBatchDropdown(true);
                            }}
                            onChange={(e) => {
                              setBatchSearch(e.target.value);
                              setStudentsForm({
                                ...studentsForm,
                                batchName: "",
                              });
                              setShowBatchDropdown(true);
                            }}
                            placeholder={
                              language === "bn"
                                ? "ব্যাচ খুঁজুন..."
                                : "Search batch..."
                            }
                            className={`${inputCls} pl-9 pr-8`}
                            autoComplete="off"
                          />
                          {(studentsForm.batchName || batchSearch) && (
                            <button
                              type="button"
                              onClick={() => {
                                setStudentsForm({
                                  ...studentsForm,
                                  batchName: "",
                                });
                                setBatchSearch("");
                                setShowBatchDropdown(false);
                              }}
                              className={`absolute right-3 top-1/2 -translate-y-1/2 ${mutedCls} hover:text-red-500 transition-colors`}
                            >
                              <FaTimesCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {showBatchDropdown && (
                          <div
                            className={`absolute z-20 mt-1 w-full rounded-xl border shadow-lg max-h-52 overflow-y-auto ${
                              isDarkMode
                                ? "bg-gray-800 border-gray-600"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            {filteredBatches.length === 0 ? (
                              <div className={`px-4 py-3 text-sm ${mutedCls}`}>
                                {language === "bn"
                                  ? "কোনো ব্যাচ পাওয়া যায়নি"
                                  : "No batches found"}
                              </div>
                            ) : (
                              filteredBatches.map((batch) => (
                                <button
                                  key={batch}
                                  type="button"
                                  onClick={() => {
                                    setStudentsForm({
                                      ...studentsForm,
                                      batchName: batch,
                                    });
                                    setBatchSearch("");
                                    setShowBatchDropdown(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                    studentsForm.batchName === batch
                                      ? "bg-teal-600 text-white"
                                      : isDarkMode
                                        ? "text-gray-200 hover:bg-gray-700"
                                        : "text-gray-800 hover:bg-teal-50"
                                  }`}
                                >
                                  {batch}
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      <SenderIdField
                        value={studentsForm.senderId}
                        onChange={(v) =>
                          setStudentsForm({ ...studentsForm, senderId: v })
                        }
                      />
                    </div>

                    {/* Matching student count badge */}
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                        filteredStudentCount > 0
                          ? "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800"
                          : isDarkMode
                            ? "bg-gray-700/40 border-gray-600"
                            : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <FaUsers
                        className={`w-4 h-4 flex-shrink-0 ${
                          filteredStudentCount > 0
                            ? "text-teal-600 dark:text-teal-400"
                            : mutedCls
                        }`}
                      />
                      <p
                        className={`text-sm font-medium ${
                          filteredStudentCount > 0
                            ? "text-teal-700 dark:text-teal-300"
                            : mutedCls
                        }`}
                      >
                        {filteredStudentCount > 0 ? (
                          <>
                            <span className="font-bold">
                              {filteredStudentCount}
                            </span>{" "}
                            {language === "bn"
                              ? "জন সক্রিয় ছাত্র এই ফিল্টারে পাওয়া গেছে"
                              : "active students match the selected filters"}
                          </>
                        ) : language === "bn" ? (
                          "কোনো ছাত্র পাওয়া যায়নি"
                        ) : (
                          "No students match the selected filters"
                        )}
                      </p>
                    </div>

                    <div>
                      <label className={labelCls}>
                        {language === "bn" ? "বার্তা" : "Message"}{" "}
                        <span className="text-red-500 normal-case text-sm">
                          *
                        </span>
                      </label>
                      <textarea
                        value={studentsForm.message}
                        onChange={(e) =>
                          setStudentsForm({
                            ...studentsForm,
                            message: e.target.value,
                          })
                        }
                        required
                        rows={5}
                        placeholder={
                          language === "bn"
                            ? "যেমন: Coaching Center OTP is 1234"
                            : "e.g. Your Coaching Center OTP is 1234"
                        }
                        className={`${inputCls} resize-none`}
                      />
                      <CharCounter text={studentsForm.message} />
                    </div>
                    <SubmitBtn
                      icon={FaUsers}
                      label={
                        language === "bn"
                          ? "ছাত্রদের কাছে পাঠান"
                          : "Send to Students"
                      }
                      loadLabel={
                        language === "bn" ? "পাঠানো হচ্ছে..." : "Sending..."
                      }
                      color="teal"
                    />
                  </div>
                )}
              </form>
            )}
          </div>
        )}

        {/* ══ HISTORY VIEW ═════════════════════════════════════════════════ */}
        {viewMode === "history" && (
          <div className="space-y-5">
            {/* Filter Bar — 3 equal columns on one line */}
            <div className={`${cardCls} p-4`}>
              <div className="grid grid-cols-3 gap-3">
                {/* Search — col 1 */}
                <div className="relative">
                  <FaSearch
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none ${mutedCls}`}
                  />
                  <input
                    type="text"
                    value={historySearchInput}
                    onChange={(e) => setHistorySearchInput(e.target.value)}
                    placeholder={
                      language === "bn"
                        ? "বার্তা বা নম্বর খুঁজুন..."
                        : "Search message or number..."
                    }
                    className={`${inputCls} pl-8 pr-7`}
                  />
                  {historySearchInput && (
                    <button
                      type="button"
                      onClick={() => setHistorySearchInput("")}
                      className={`absolute right-2.5 top-1/2 -translate-y-1/2 ${mutedCls} hover:text-red-500 transition-colors`}
                    >
                      <FaTimesCircle className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Type filter — col 2 */}
                <select
                  value={historyFilters.type || ""}
                  onChange={(e) => {
                    setHistoryPage(1);
                    setHistoryFilters({
                      ...historyFilters,
                      type: e.target.value || undefined,
                    });
                  }}
                  className={inputCls}
                >
                  <option value="">
                    {language === "bn" ? "সব ধরন" : "All Types"}
                  </option>
                  <option value="single">
                    {language === "bn" ? "একক" : "Single"}
                  </option>
                  <option value="bulk">
                    {language === "bn" ? "বাল্ক" : "Bulk"}
                  </option>
                  <option value="custom">
                    {language === "bn" ? "কাস্টম" : "Custom"}
                  </option>
                </select>

                {/* Status filter — col 3 */}
                <select
                  value={historyFilters.status || ""}
                  onChange={(e) => {
                    setHistoryPage(1);
                    setHistoryFilters({
                      ...historyFilters,
                      status: e.target.value || undefined,
                    });
                  }}
                  className={inputCls}
                >
                  <option value="">
                    {language === "bn" ? "সব স্ট্যাটাস" : "All Status"}
                  </option>
                  <option value="sent">
                    {language === "bn" ? "পাঠানো" : "Sent"}
                  </option>
                  <option value="failed">
                    {language === "bn" ? "ব্যর্থ" : "Failed"}
                  </option>
                  <option value="pending">
                    {language === "bn" ? "অপেক্ষমান" : "Pending"}
                  </option>
                </select>
              </div>
            </div>

            {isDataPending ? (
              <div className={cardCls}>
                <GlobalLoading embedded titleKey="loadingBulkSms" />
              </div>
            ) : smsHistory.length === 0 ? (
              <div className={`${cardCls} py-20 text-center`}>
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <FaFileAlt
                    className={`w-7 h-7 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                  />
                </div>
                <p className={`font-semibold ${textCls}`}>
                  {language === "bn"
                    ? "কোনো SMS ইতিহাস নেই"
                    : "No SMS history found"}
                </p>
                <p className={`text-sm mt-1 ${mutedCls}`}>
                  {historySearchInput ||
                  historyFilters.type ||
                  historyFilters.status
                    ? language === "bn"
                      ? "ফিল্টার পরিবর্তন করুন"
                      : "Try changing the filters"
                    : language === "bn"
                      ? "নতুন SMS পাঠালে এখানে দেখা যাবে"
                      : "Sent messages will appear here"}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {smsHistory.map((sms) => (
                    <div key={sms._id} className={`${cardCls} overflow-hidden`}>
                      <div
                        className={`h-1 w-full ${
                          sms.status === "sent" || sms.status === "delivered"
                            ? "bg-emerald-500"
                            : sms.status === "failed"
                              ? "bg-red-500"
                              : "bg-amber-400"
                        }`}
                      />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <p
                            className={`font-semibold text-sm leading-snug flex-1 ${textCls}`}
                          >
                            {sms.message.length > 80
                              ? `${sms.message.substring(0, 80)}…`
                              : sms.message}
                          </p>
                          {getStatusBadge(sms.status)}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3">
                          <span className={`text-xs ${mutedCls}`}>
                            {new Date(sms.createdAt).toLocaleString()}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              isDarkMode
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {sms.type.charAt(0).toUpperCase() +
                              sms.type.slice(1)}
                          </span>
                        </div>
                        <div
                          className={`flex gap-4 text-xs font-medium py-2.5 px-3 rounded-xl ${
                            isDarkMode ? "bg-gray-700/60" : "bg-gray-50"
                          }`}
                        >
                          <span className={mutedCls}>
                            {language === "bn" ? "মোট" : "Total"}:{" "}
                            <strong className={textCls}>
                              {sms.totalRecipients}
                            </strong>
                          </span>
                          <span className="text-emerald-600 dark:text-emerald-400">
                            {language === "bn" ? "সফল" : "Sent"}:{" "}
                            <strong>{sms.sentCount}</strong>
                          </span>
                          <span className="text-red-500">
                            {language === "bn" ? "ব্যর্থ" : "Failed"}:{" "}
                            <strong>{sms.failedCount}</strong>
                          </span>
                        </div>
                        {sms.message.length > 80 && (
                          <details className="mt-3">
                            <summary
                              className={`cursor-pointer text-xs font-medium select-none ${
                                isDarkMode
                                  ? "text-blue-400 hover:text-blue-300"
                                  : "text-blue-600 hover:text-blue-700"
                              }`}
                            >
                              {language === "bn"
                                ? "সম্পূর্ণ বার্তা দেখুন"
                                : "View full message"}
                            </summary>
                            <p
                              className={`mt-2 text-sm p-3 rounded-xl leading-relaxed ${
                                isDarkMode
                                  ? "bg-gray-700/60 text-gray-300"
                                  : "bg-gray-50 text-gray-700"
                              }`}
                            >
                              {sms.message}
                            </p>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── Pagination ── */}
                {historyPagination && historyPagination.totalPages > 1 && (
                  <div className={`${cardCls} p-4`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      {/* Page info */}
                      <span className={`text-xs font-medium ${mutedCls}`}>
                        {language === "bn"
                          ? `পৃষ্ঠা ${historyPagination.page} / ${historyPagination.totalPages}`
                          : `Page ${historyPagination.page} of ${historyPagination.totalPages}`}
                      </span>

                      {/* Page buttons */}
                      <div className="flex items-center gap-1.5">
                        {/* Prev */}
                        <button
                          type="button"
                          disabled={!historyPagination.hasPrev || isDataPending}
                          onClick={() => setHistoryPage((p) => p - 1)}
                          className={`flex items-center justify-center w-8 h-8 rounded-lg border text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            isDarkMode
                              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                              : "border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <FaChevronLeft className="w-3 h-3" />
                        </button>

                        {/* Page numbers */}
                        {Array.from(
                          { length: historyPagination.totalPages },
                          (_, i) => i + 1,
                        )
                          .filter((p) => {
                            const cur = historyPagination.page;
                            return (
                              p === 1 ||
                              p === historyPagination.totalPages ||
                              Math.abs(p - cur) <= 1
                            );
                          })
                          .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                            if (
                              idx > 0 &&
                              (p as number) - (arr[idx - 1] as number) > 1
                            )
                              acc.push("…");
                            acc.push(p);
                            return acc;
                          }, [])
                          .map((p, idx) =>
                            p === "…" ? (
                              <span
                                key={`ellipsis-${idx}`}
                                className={`px-1 text-sm ${mutedCls}`}
                              >
                                …
                              </span>
                            ) : (
                              <button
                                key={p}
                                type="button"
                                disabled={isDataPending}
                                onClick={() => setHistoryPage(p as number)}
                                className={`flex items-center justify-center w-8 h-8 rounded-lg border text-sm font-medium transition-colors disabled:cursor-not-allowed ${
                                  historyPagination.page === p
                                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                                    : isDarkMode
                                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                                      : "border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                {p}
                              </button>
                            ),
                          )}

                        {/* Next */}
                        <button
                          type="button"
                          disabled={!historyPagination.hasNext || isDataPending}
                          onClick={() => setHistoryPage((p) => p + 1)}
                          className={`flex items-center justify-center w-8 h-8 rounded-lg border text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                            isDarkMode
                              ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                              : "border-gray-200 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <FaChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ══ STATS VIEW ═══════════════════════════════════════════════════ */}
        {viewMode === "stats" && (
          <div className="space-y-5">
            {isDataPending && !stats ? (
              <div className={cardCls}>
                <GlobalLoading embedded titleKey="loadingBulkSms" />
              </div>
            ) : stats ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      label: { en: "Total SMS", bn: "মোট SMS" },
                      value: stats.totalSMS,
                      icon: FaEnvelope,
                      bg: "bg-blue-50 dark:bg-blue-900/20",
                      iconBg: "bg-blue-600",
                      text: "text-blue-700 dark:text-blue-300",
                    },
                    {
                      label: { en: "Sent", bn: "সফল" },
                      value: stats.sentSMS,
                      icon: FaCheckCircle,
                      bg: "bg-emerald-50 dark:bg-emerald-900/20",
                      iconBg: "bg-emerald-600",
                      text: "text-emerald-700 dark:text-emerald-300",
                    },
                    {
                      label: { en: "Failed", bn: "ব্যর্থ" },
                      value: stats.failedSMS,
                      icon: FaTimesCircle,
                      bg: "bg-red-50 dark:bg-red-900/20",
                      iconBg: "bg-red-600",
                      text: "text-red-700 dark:text-red-300",
                    },
                    {
                      label: { en: "Total Recipients", bn: "মোট প্রাপক" },
                      value: stats.totalRecipients,
                      icon: FaUsers,
                      bg: "bg-violet-50 dark:bg-violet-900/20",
                      iconBg: "bg-violet-600",
                      text: "text-violet-700 dark:text-violet-300",
                    },
                  ].map(({ label, value, icon: Icon, bg, iconBg, text }) => (
                    <div
                      key={label.en}
                      className={`rounded-2xl border p-5 transition-colors duration-200 ${bg} ${
                        isDarkMode ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}
                      >
                        <Icon className="w-4.5 h-4.5 text-white" />
                      </div>
                      <div className={`text-3xl font-bold mb-1 ${text}`}>
                        {value?.toLocaleString() ?? 0}
                      </div>
                      <div className={`text-sm font-medium ${mutedCls}`}>
                        {language === "bn" ? label.bn : label.en}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery rate bar */}
                <div className={`${cardCls} p-6`}>
                  <h3 className={`text-sm font-bold mb-4 ${textCls}`}>
                    {language === "bn" ? "ডেলিভারি রেট" : "Delivery Rate"}
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: { en: "Sent", bn: "সফল" },
                        value: stats.sentSMS,
                        total: stats.totalSMS,
                        color: "bg-emerald-500",
                      },
                      {
                        label: { en: "Failed", bn: "ব্যর্থ" },
                        value: stats.failedSMS,
                        total: stats.totalSMS,
                        color: "bg-red-500",
                      },
                    ].map(({ label, value, total, color }) => {
                      const pct =
                        total > 0 ? Math.round((value / total) * 100) : 0;
                      return (
                        <div key={label.en}>
                          <div className="flex justify-between text-xs font-medium mb-1.5">
                            <span className={mutedCls}>
                              {language === "bn" ? label.bn : label.en}
                            </span>
                            <span className={textCls}>{pct}%</span>
                          </div>
                          <div
                            className={`h-2 rounded-full overflow-hidden ${
                              isDarkMode ? "bg-gray-700" : "bg-gray-100"
                            }`}
                          >
                            <div
                              className={`h-full rounded-full ${color} transition-all duration-700`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className={`${cardCls} py-16 text-center`}>
                <FaChartBar className={`w-10 h-10 mx-auto mb-3 ${mutedCls}`} />
                <p className={mutedCls}>
                  {language === "bn"
                    ? "কোনো পরিসংখ্যান পাওয়া যায়নি"
                    : "No statistics available"}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
