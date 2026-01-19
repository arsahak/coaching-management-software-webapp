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
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaFile,
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

export default function BulkSMSManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const [isPending, startTransition] = useTransition();

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>("send");
  const [sendMode, setSendMode] = useState<SendMode>("single");

  // Form state
  const [singleForm, setSingleForm] = useState({
    mobileNumber: "",
    message: "",
    senderId: "Random",
    apiKey: "",
  });

  const [bulkForm, setBulkForm] = useState({
    mobileNumbers: "",
    message: "",
    senderId: "Random",
    apiKey: "",
  });

  const [customForm, setCustomForm] = useState<
    Array<{
      number: string;
      message: string;
    }>
  >([{ number: "", message: "" }]);

  const [studentsForm, setStudentsForm] = useState({
    message: "",
    class: "",
    batchName: "",
    senderId: "Random",
    apiKey: "",
  });

  // History state
  const [smsHistory, setSmsHistory] = useState<SMSRecord[]>([]);
  const [historyFilters, setHistoryFilters] = useState<{
    type?: string;
    status?: string;
    search?: string;
  }>({});
  const [stats, setStats] = useState<any>(null);

  // Students data for filtering
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Load SMS history
  useEffect(() => {
    if (viewMode === "history") {
      loadSMSHistory();
    }
  }, [viewMode, historyFilters]);

  // Load stats
  useEffect(() => {
    if (viewMode === "stats") {
      loadStats();
    }
  }, [viewMode]);

  // Load students when in students mode
  useEffect(() => {
    if (sendMode === "students") {
      loadAdmissions();
    }
  }, [sendMode, studentsForm.class, studentsForm.batchName]);

  const loadSMSHistory = async () => {
    startTransition(async () => {
      const result = await getSMSHistory(1, 100, historyFilters);
      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setSmsHistory(data as SMSRecord[]);
      }
    });
  };

  const loadStats = async () => {
    startTransition(async () => {
      const result = await getSMSStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
    });
  };

  const loadAdmissions = async () => {
    startTransition(async () => {
      const result = await getAdmissions(1, 1000, "", {
        class: studentsForm.class || undefined,
        batch: studentsForm.batchName || undefined,
        status: "active",
      });
      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setAdmissions(data as Admission[]);
      }
    });
  };

  const handleSendSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleForm.mobileNumber || !singleForm.message) {
      toast.error(
        language === "bn"
          ? "মোবাইল নম্বর এবং বার্তা প্রয়োজন"
          : "Mobile number and message are required"
      );
      return;
    }

    startTransition(async () => {
      const result = await sendSingleSMS({
        mobileNumber: singleForm.mobileNumber,
        message: singleForm.message,
        senderId: singleForm.senderId,
        apiKey: singleForm.apiKey || undefined,
      });

      if (result.success) {
        toast.success(
          result.message ||
            (language === "bn"
              ? "SMS সফলভাবে পাঠানো হয়েছে"
              : "SMS sent successfully")
        );
        setSingleForm({ ...singleForm, mobileNumber: "", message: "" });
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "SMS পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const handleSendBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    const numbers = bulkForm.mobileNumbers
      .split(/[,\n]/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (numbers.length === 0 || !bulkForm.message) {
      toast.error(
        language === "bn"
          ? "মোবাইল নম্বর এবং বার্তা প্রয়োজন"
          : "Mobile numbers and message are required"
      );
      return;
    }

    startTransition(async () => {
      const result = await sendBulkSMS({
        mobileNumbers: numbers,
        message: bulkForm.message,
        senderId: bulkForm.senderId,
        apiKey: bulkForm.apiKey || undefined,
      });

      if (result.success) {
        toast.success(
          result.message ||
            (language === "bn"
              ? "Bulk SMS সফলভাবে পাঠানো হয়েছে"
              : "Bulk SMS sent successfully")
        );
        setBulkForm({ ...bulkForm, mobileNumbers: "", message: "" });
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "Bulk SMS পাঠাতে ব্যর্থ"
              : "Failed to send bulk SMS")
        );
      }
    });
  };

  const handleSendCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const validMessages = customForm.filter(
      (m) => m.number.trim() && m.message.trim()
    );

    if (validMessages.length === 0) {
      toast.error(
        language === "bn"
          ? "কমপক্ষে একটি বার্তা প্রয়োজন"
          : "At least one message is required"
      );
      return;
    }

    startTransition(async () => {
      const result = await sendBulkSMSCustom({
        messages: validMessages,
      });

      if (result.success) {
        toast.success(
          result.message ||
            (language === "bn"
              ? "SMS সফলভাবে পাঠানো হয়েছে"
              : "SMS sent successfully")
        );
        setCustomForm([{ number: "", message: "" }]);
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "SMS পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const handleSendToStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentsForm.message) {
      toast.error(
        language === "bn" ? "বার্তা প্রয়োজন" : "Message is required"
      );
      return;
    }

    startTransition(async () => {
      const result = await sendSMSToStudents({
        message: studentsForm.message,
        filters: {
          class: studentsForm.class || undefined,
          batchName: studentsForm.batchName || undefined,
        },
        senderId: studentsForm.senderId,
        apiKey: studentsForm.apiKey || undefined,
      });

      if (result.success) {
        toast.success(
          result.message ||
            (language === "bn"
              ? "SMS সফলভাবে পাঠানো হয়েছে"
              : "SMS sent successfully")
        );
        setStudentsForm({ ...studentsForm, message: "" });
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "SMS পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const addCustomMessageRow = () => {
    setCustomForm([...customForm, { number: "", message: "" }]);
  };

  const removeCustomMessageRow = (index: number) => {
    setCustomForm(customForm.filter((_, i) => i !== index));
  };

  const updateCustomMessage = (
    index: number,
    field: "number" | "message",
    value: string
  ) => {
    const updated = [...customForm];
    updated[index] = { ...updated[index], [field]: value };
    setCustomForm(updated);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      sent: {
        color:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        icon: FaCheckCircle,
      },
      failed: {
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        icon: FaTimesCircle,
      },
      pending: {
        color:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        icon: FaTimesCircle,
      },
      delivered: {
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        icon: FaCheckCircle,
      },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Stats View
  if (viewMode === "stats") {
    return (
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={() => setViewMode("send")}
              className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-white hover:bg-gray-100 text-gray-900"
              }`}
            >
              <FaArrowLeft />
              {language === "bn" ? "পিছনে" : "Back"}
            </button>
            <h1
              className={`text-3xl font-bold mb-2 transition-colors duration-200 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {language === "bn" ? "SMS পরিসংখ্যান" : "SMS Statistics"}
            </h1>
          </div>

          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div
                  className={`text-sm mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {language === "bn" ? "মোট SMS" : "Total SMS"}
                </div>
                <div
                  className={`text-3xl font-bold transition-colors duration-200 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {stats.totalSMS || 0}
                </div>
              </div>
              <div
                className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div
                  className={`text-sm mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {language === "bn" ? "সফল" : "Sent"}
                </div>
                <div
                  className={`text-3xl font-bold text-green-600 transition-colors duration-200`}
                >
                  {stats.sentSMS || 0}
                </div>
              </div>
              <div
                className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div
                  className={`text-sm mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {language === "bn" ? "ব্যর্থ" : "Failed"}
                </div>
                <div
                  className={`text-3xl font-bold text-red-600 transition-colors duration-200`}
                >
                  {stats.failedSMS || 0}
                </div>
              </div>
              <div
                className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div
                  className={`text-sm mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {language === "bn" ? "মোট প্রাপক" : "Total Recipients"}
                </div>
                <div
                  className={`text-3xl font-bold transition-colors duration-200 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {stats.totalRecipients || 0}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // History View
  if (viewMode === "history") {
    return (
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={() => setViewMode("send")}
              className={`mb-4 flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
                isDarkMode
                  ? "bg-gray-800 hover:bg-gray-700 text-white"
                  : "bg-white hover:bg-gray-100 text-gray-900"
              }`}
            >
              <FaArrowLeft />
              {language === "bn" ? "পিছনে" : "Back"}
            </button>
            <h1
              className={`text-3xl font-bold mb-2 transition-colors duration-200 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {language === "bn" ? "SMS ইতিহাস" : "SMS History"}
            </h1>
          </div>

          {/* Filters */}
          <div
            className={`p-4 rounded-xl shadow-md mb-6 transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={historyFilters.search || ""}
                    onChange={(e) =>
                      setHistoryFilters({
                        ...historyFilters,
                        search: e.target.value,
                      })
                    }
                    placeholder={
                      language === "bn"
                        ? "বার্তা, নম্বর..."
                        : "Search message, number..."
                    }
                    className={`w-full px-4 py-2 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                  <FaSearch
                    className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  />
                </div>
              </div>
              <select
                value={historyFilters.type || ""}
                onChange={(e) =>
                  setHistoryFilters({
                    ...historyFilters,
                    type: e.target.value || undefined,
                  })
                }
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-300 bg-white text-gray-900"
                }`}
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
              <select
                value={historyFilters.status || ""}
                onChange={(e) =>
                  setHistoryFilters({
                    ...historyFilters,
                    status: e.target.value || undefined,
                  })
                }
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-300 bg-white text-gray-900"
                }`}
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

          {/* SMS History List */}
          {isPending ? (
            <div className="text-center py-12">
              <p
                className={`transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
              </p>
            </div>
          ) : smsHistory.length === 0 ? (
            <div
              className={`text-center py-12 rounded-xl transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <FaFile
                className={`mx-auto text-6xl mb-4 transition-colors duration-200 ${
                  isDarkMode ? "text-gray-600" : "text-gray-300"
                }`}
              />
              <p
                className={`text-lg transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {language === "bn"
                  ? "কোন SMS ইতিহাস নেই"
                  : "No SMS history found"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {smsHistory.map((sms) => (
                <div
                  key={sms._id}
                  className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3
                        className={`text-lg font-semibold mb-2 transition-colors duration-200 ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {sms.message.length > 50
                          ? `${sms.message.substring(0, 50)}...`
                          : sms.message}
                      </h3>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(sms.status)}
                        <span
                          className={`text-xs ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {new Date(sms.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {language === "bn" ? "মোট প্রাপক" : "Total Recipients"}:{" "}
                    {sms.totalRecipients} |{" "}
                    {language === "bn" ? "পাঠানো" : "Sent"}: {sms.sentCount} |{" "}
                    {language === "bn" ? "ব্যর্থ" : "Failed"}: {sms.failedCount}
                  </div>
                  <details
                    className={`mt-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <summary className="cursor-pointer font-medium mb-2">
                      {language === "bn"
                        ? "সম্পূর্ণ বার্তা দেখুন"
                        : "View full message"}
                    </summary>
                    <p
                      className={`mt-2 p-3 rounded-lg ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      {sms.message}
                    </p>
                  </details>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Send View
  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="p-6">
        <div className="mb-6">
          <h1
            className={`text-3xl font-bold mb-2 transition-colors duration-200 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {language === "bn" ? "Bulk SMS ব্যবস্থাপনা" : "Bulk SMS Management"}
          </h1>
          <p
            className={`text-sm transition-colors duration-200 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {language === "bn"
              ? "SMS পাঠান এবং ইতিহাস দেখুন"
              : "Send SMS and view history"}
          </p>
        </div>

        {/* Mode Tabs */}
        <div
          className={`mb-6 rounded-xl shadow-md transition-colors duration-200 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode("send")}
              className={`flex-1 px-4 py-3 font-medium transition-colors duration-200 ${
                viewMode === "send"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {language === "bn" ? "SMS পাঠান" : "Send SMS"}
            </button>
            <button
              onClick={() => setViewMode("history")}
              className={`flex-1 px-4 py-3 font-medium transition-colors duration-200 ${
                (viewMode as ViewMode) === "history"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {language === "bn" ? "ইতিহাস" : "History"}
            </button>
            <button
              onClick={() => setViewMode("stats")}
              className={`flex-1 px-4 py-3 font-medium transition-colors duration-200 ${
                (viewMode as ViewMode) === "stats"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : isDarkMode
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {language === "bn" ? "পরিসংখ্যান" : "Statistics"}
            </button>
          </div>
        </div>

        {/* Send Mode Tabs */}
        <div
          className={`mb-6 rounded-xl shadow-md transition-colors duration-200 ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <div className="flex flex-wrap gap-2 p-4">
            <button
              onClick={() => setSendMode("single")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sendMode === "single"
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {language === "bn" ? "একক SMS" : "Single SMS"}
            </button>
            <button
              onClick={() => setSendMode("bulk")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sendMode === "bulk"
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {language === "bn"
                ? "Bulk SMS (একই বার্তা)"
                : "Bulk SMS (Same Message)"}
            </button>
            <button
              onClick={() => setSendMode("custom")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sendMode === "custom"
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {language === "bn"
                ? "Bulk SMS (ভিন্ন বার্তা)"
                : "Bulk SMS (Different Messages)"}
            </button>
            <button
              onClick={() => setSendMode("students")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                sendMode === "students"
                  ? "bg-blue-600 text-white"
                  : isDarkMode
                  ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              {language === "bn" ? "ছাত্রদের কাছে পাঠান" : "Send to Students"}
            </button>
          </div>
        </div>

        {/* Single SMS Form */}
        {sendMode === "single" && (
          <form
            onSubmit={handleSendSingle}
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 transition-colors duration-200 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {language === "bn" ? "একক SMS পাঠান" : "Send Single SMS"}
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {language === "bn" ? "মোবাইল নম্বর" : "Mobile Number"} *
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
                  placeholder="017XXXXXXXX"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {language === "bn" ? "বার্তা" : "Message"} *
                </label>
                <textarea
                  value={singleForm.message}
                  onChange={(e) =>
                    setSingleForm({ ...singleForm, message: e.target.value })
                  }
                  required
                  rows={5}
                  placeholder={
                    language === "bn"
                      ? "আপনার বার্তা লিখুন..."
                      : "Enter your message..."
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
                <p
                  className={`text-xs mt-1 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {singleForm.message.length}{" "}
                  {language === "bn" ? "অক্ষর" : "characters"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "Sender ID" : "Sender ID"}
                  </label>
                  <input
                    type="text"
                    value={singleForm.senderId}
                    onChange={(e) =>
                      setSingleForm({ ...singleForm, senderId: e.target.value })
                    }
                    placeholder="Random"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn"
                      ? "API Key (ঐচ্ছিক)"
                      : "API Key (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={singleForm.apiKey}
                    onChange={(e) =>
                      setSingleForm({ ...singleForm, apiKey: e.target.value })
                    }
                    placeholder="Leave empty to use default"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaPaperPlane />
                {isPending
                  ? language === "bn"
                    ? "পাঠানো হচ্ছে..."
                    : "Sending..."
                  : language === "bn"
                  ? "SMS পাঠান"
                  : "Send SMS"}
              </button>
            </div>
          </form>
        )}

        {/* Bulk SMS Form */}
        {sendMode === "bulk" && (
          <form
            onSubmit={handleSendBulk}
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 transition-colors duration-200 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {language === "bn"
                ? "Bulk SMS পাঠান (একই বার্তা)"
                : "Send Bulk SMS (Same Message)"}
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {language === "bn"
                    ? "মোবাইল নম্বর (কমা বা লাইনে আলাদা করুন)"
                    : "Mobile Numbers (comma or line separated)"}{" "}
                  *
                </label>
                <textarea
                  value={bulkForm.mobileNumbers}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, mobileNumbers: e.target.value })
                  }
                  required
                  rows={6}
                  placeholder="017XXXXXXXX, 018XXXXXXXX&#10;019XXXXXXXX"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
                <p
                  className={`text-xs mt-1 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {
                    bulkForm.mobileNumbers
                      .split(/[,\n]/)
                      .filter((n) => n.trim()).length
                  }{" "}
                  {language === "bn" ? "নম্বর" : "numbers"}
                </p>
              </div>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {language === "bn" ? "বার্তা" : "Message"} *
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
                      : "Enter your message..."
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
                <p
                  className={`text-xs mt-1 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {bulkForm.message.length}{" "}
                  {language === "bn" ? "অক্ষর" : "characters"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "Sender ID" : "Sender ID"}
                  </label>
                  <input
                    type="text"
                    value={bulkForm.senderId}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, senderId: e.target.value })
                    }
                    placeholder="Random"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn"
                      ? "API Key (ঐচ্ছিক)"
                      : "API Key (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={bulkForm.apiKey}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, apiKey: e.target.value })
                    }
                    placeholder="Leave empty to use default"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaPaperPlane />
                {isPending
                  ? language === "bn"
                    ? "পাঠানো হচ্ছে..."
                    : "Sending..."
                  : language === "bn"
                  ? "Bulk SMS পাঠান"
                  : "Send Bulk SMS"}
              </button>
            </div>
          </form>
        )}

        {/* Custom Bulk SMS Form */}
        {sendMode === "custom" && (
          <form
            onSubmit={handleSendCustom}
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className={`text-xl font-bold transition-colors duration-200 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {language === "bn"
                  ? "Bulk SMS পাঠান (ভিন্ন বার্তা)"
                  : "Send Bulk SMS (Different Messages)"}
              </h2>
              <button
                type="button"
                onClick={addCustomMessageRow}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2"
              >
                <FaPlus />
                {language === "bn" ? "যোগ করুন" : "Add Row"}
              </button>
            </div>
            <div className="space-y-4">
              {customForm.map((msg, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors duration-200 ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className={`text-sm font-medium transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {language === "bn" ? "বার্তা" : "Message"} {index + 1}
                    </span>
                    {customForm.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCustomMessageRow(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label
                        className={`block text-xs font-medium mb-1 transition-colors duration-200 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {language === "bn" ? "মোবাইল নম্বর" : "Mobile Number"} *
                      </label>
                      <input
                        type="text"
                        value={msg.number}
                        onChange={(e) =>
                          updateCustomMessage(index, "number", e.target.value)
                        }
                        required
                        placeholder="017XXXXXXXX"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label
                        className={`block text-xs font-medium mb-1 transition-colors duration-200 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        {language === "bn" ? "বার্তা" : "Message"} *
                      </label>
                      <textarea
                        value={msg.message}
                        onChange={(e) =>
                          updateCustomMessage(index, "message", e.target.value)
                        }
                        required
                        rows={2}
                        placeholder={
                          language === "bn"
                            ? "বার্তা লিখুন..."
                            : "Enter message..."
                        }
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all text-sm ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-800 text-white"
                            : "border-gray-300 bg-white text-gray-900"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={isPending}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaPaperPlane />
                {isPending
                  ? language === "bn"
                    ? "পাঠানো হচ্ছে..."
                    : "Sending..."
                  : language === "bn"
                  ? "Bulk SMS পাঠান"
                  : "Send Bulk SMS"}
              </button>
            </div>
          </form>
        )}

        {/* Send to Students Form */}
        {sendMode === "students" && (
          <form
            onSubmit={handleSendToStudents}
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-bold mb-4 transition-colors duration-200 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {language === "bn"
                ? "ছাত্রদের কাছে SMS পাঠান"
                : "Send SMS to Students"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "শ্রেণি" : "Class"}
                  </label>
                  <select
                    value={studentsForm.class}
                    onChange={(e) =>
                      setStudentsForm({
                        ...studentsForm,
                        class: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">
                      {language === "bn" ? "সব শ্রেণি" : "All Classes"}
                    </option>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1} value={`Class ${i + 1}`}>
                        {language === "bn" ? "ক্লাস" : "Class"} {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "ব্যাচ" : "Batch"}
                  </label>
                  <input
                    type="text"
                    value={studentsForm.batchName}
                    onChange={(e) =>
                      setStudentsForm({
                        ...studentsForm,
                        batchName: e.target.value,
                      })
                    }
                    placeholder={language === "bn" ? "ব্যাচ নাম" : "Batch name"}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>
              {admissions.length > 0 && (
                <div
                  className={`p-4 rounded-lg transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <p
                    className={`text-sm mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn"
                      ? "নির্বাচিত ফিল্টারে"
                      : "Selected filters"}
                    : {admissions.length}{" "}
                    {language === "bn"
                      ? "জন ছাত্র পাওয়া গেছে"
                      : "students found"}
                  </p>
                </div>
              )}
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {language === "bn" ? "বার্তা" : "Message"} *
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
                      ? "আপনার বার্তা লিখুন..."
                      : "Enter your message..."
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
                <p
                  className={`text-xs mt-1 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {studentsForm.message.length}{" "}
                  {language === "bn" ? "অক্ষর" : "characters"}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "Sender ID" : "Sender ID"}
                  </label>
                  <input
                    type="text"
                    value={studentsForm.senderId}
                    onChange={(e) =>
                      setStudentsForm({
                        ...studentsForm,
                        senderId: e.target.value,
                      })
                    }
                    placeholder="Random"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn"
                      ? "API Key (ঐচ্ছিক)"
                      : "API Key (Optional)"}
                  </label>
                  <input
                    type="text"
                    value={studentsForm.apiKey}
                    onChange={(e) =>
                      setStudentsForm({
                        ...studentsForm,
                        apiKey: e.target.value,
                      })
                    }
                    placeholder="Leave empty to use default"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaUsers />
                {isPending
                  ? language === "bn"
                    ? "পাঠানো হচ্ছে..."
                    : "Sending..."
                  : language === "bn"
                  ? "ছাত্রদের কাছে পাঠান"
                  : "Send to Students"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
