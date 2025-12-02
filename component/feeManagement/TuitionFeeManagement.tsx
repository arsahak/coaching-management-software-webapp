"use client";

import {
  createFee,
  createBulkFees,
  deleteFee,
  getFeeStats,
  getFees,
  sendOverdueSMS,
  sendPaymentConfirmationSMS,
  sendPaymentReminderSMS,
  updateFee,
} from "@/app/actions/fee";
import { getAdmissions } from "@/app/actions/admission";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSms,
  FaCalendarAlt,
  FaChartBar,
  FaSearch,
  FaMoneyBillWave,
  FaExclamationTriangle,
} from "react-icons/fa";

interface Fee {
  _id: string;
  admissionId: string | any;
  studentId?: string;
  studentName: string;
  monthlyFee: number;
  amountPaid: number;
  amountDue: number;
  status: "pending" | "paid" | "overdue" | "partial";
  paymentDate?: string;
  dueDate: string;
  paymentMethod?: string;
  transactionId?: string;
  month: number;
  year: number;
  paymentSmsSent: boolean;
  reminderSmsSent: boolean;
  overdueSmsSent: boolean;
  notes?: string;
}

interface Admission {
  _id: string;
  studentName: string;
  studentId?: string;
  class: string;
  batchName: string;
  monthlyFee: number;
}

export default function TuitionFeeManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [fees, setFees] = useState<Fee[]>([]);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit" | "payment" | "bulk">("list");
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    class?: string;
    status?: "pending" | "paid" | "overdue" | "partial";
    month?: number;
    year?: number;
  }>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [admissions, setAdmissions] = useState<Admission[]>([]);

  // Form state for fee
  const [feeForm, setFeeForm] = useState({
    admissionId: "",
    monthlyFee: "",
    dueDate: "",
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    notes: "",
  });

  // Form state for payment
  const [paymentForm, setPaymentForm] = useState({
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "cash" as const,
    transactionId: "",
    sendSms: true,
  });

  // Bulk fee form
  const [bulkForm, setBulkForm] = useState({
    month: (new Date().getMonth() + 1).toString(),
    year: new Date().getFullYear().toString(),
    dueDate: "",
    class: "",
    batchName: "",
  });

  // Load fees
  useEffect(() => {
    loadFees();
    loadStats();
  }, [filters, search]);

  // Load admissions for create form
  useEffect(() => {
    if (viewMode === "create") {
      loadAdmissions();
    }
  }, [viewMode]);

  const loadFees = async () => {
    startTransition(async () => {
      const result = await getFees(1, 1000, filters);

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setFees(data as Fee[]);
      }
    });
  };

  const loadStats = async () => {
    startTransition(async () => {
      const result = await getFeeStats(
        filters.month,
        filters.year,
        filters.class
      );

      if (result.success && result.data) {
        setStats(result.data);
      }
    });
  };

  const loadAdmissions = async () => {
    startTransition(async () => {
      const result = await getAdmissions(1, 1000, "", {
        class: filters.class,
        status: "active",
      });

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setAdmissions(data as Admission[]);
      }
    });
  };

  const handleCreateFee = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await createFee({
        admissionId: feeForm.admissionId,
        monthlyFee: parseFloat(feeForm.monthlyFee),
        dueDate: feeForm.dueDate,
        month: parseInt(feeForm.month),
        year: parseInt(feeForm.year),
        notes: feeForm.notes || undefined,
      });

      if (result.success) {
        toast.success(
          language === "bn"
            ? "ফি রেকর্ড সফলভাবে তৈরি করা হয়েছে"
            : "Fee record created successfully"
        );
        setViewMode("list");
        setFeeForm({
          admissionId: "",
          monthlyFee: "",
          dueDate: "",
          month: (new Date().getMonth() + 1).toString(),
          year: new Date().getFullYear().toString(),
          notes: "",
        });
        loadFees();
        loadStats();
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "ফি রেকর্ড তৈরি করতে ব্যর্থ" : "Failed to create fee record")
        );
      }
    });
  };

  const handleCreateBulkFees = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await createBulkFees(
        parseInt(bulkForm.month),
        parseInt(bulkForm.year),
        bulkForm.dueDate,
        bulkForm.class || undefined,
        bulkForm.batchName || undefined
      );

      if (result.success) {
        toast.success(
          language === "bn"
            ? "বাল্ক ফি রেকর্ড সফলভাবে তৈরি করা হয়েছে"
            : "Bulk fee records created successfully"
        );
        setViewMode("list");
        setBulkForm({
          month: (new Date().getMonth() + 1).toString(),
          year: new Date().getFullYear().toString(),
          dueDate: "",
          class: "",
          batchName: "",
        });
        loadFees();
        loadStats();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "বাল্ক ফি রেকর্ড তৈরি করতে ব্যর্থ"
              : "Failed to create bulk fee records")
        );
      }
    });
  };

  const handleUpdatePayment = async (feeId: string) => {
    startTransition(async () => {
      const result = await updateFee(feeId, {
        amountPaid: parseFloat(paymentForm.amountPaid),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        transactionId: paymentForm.transactionId || undefined,
        sendSms: paymentForm.sendSms,
      });

      if (result.success) {
        toast.success(
          language === "bn"
            ? "পেমেন্ট সফলভাবে আপডেট করা হয়েছে"
            : "Payment updated successfully"
        );
        setViewMode("list");
        setSelectedFee(null);
        setPaymentForm({
          amountPaid: "",
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: "cash",
          transactionId: "",
          sendSms: true,
        });
        loadFees();
        loadStats();
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "পেমেন্ট আপডেট করতে ব্যর্থ" : "Failed to update payment")
        );
      }
    });
  };

  const handleDeleteFee = async (id: string) => {
    if (
      !confirm(
        language === "bn"
          ? "আপনি কি এই ফি রেকর্ড মুছে ফেলতে চান?"
          : "Are you sure you want to delete this fee record?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteFee(id);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "ফি রেকর্ড সফলভাবে মুছে ফেলা হয়েছে"
            : "Fee record deleted successfully"
        );
        loadFees();
        loadStats();
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "ফি রেকর্ড মুছতে ব্যর্থ" : "Failed to delete fee record")
        );
      }
    });
  };

  const handleSendReminderSMS = async (feeId: string) => {
    startTransition(async () => {
      const result = await sendPaymentReminderSMS(feeId);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "পেমেন্ট অনুস্মারক এসএমএস সফলভাবে পাঠানো হয়েছে"
            : "Payment reminder SMS sent successfully"
        );
        loadFees();
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "এসএমএস পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const handleSendOverdueSMS = async (feeId: string) => {
    startTransition(async () => {
      const result = await sendOverdueSMS(feeId);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "বকেয়া এসএমএস সফলভাবে পাঠানো হয়েছে"
            : "Overdue SMS sent successfully"
        );
        loadFees();
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "এসএমএস পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const handleSendPaymentSMS = async (feeId: string) => {
    startTransition(async () => {
      const result = await sendPaymentConfirmationSMS(feeId);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "পেমেন্ট কনফার্মেশন এসএমএস সফলভাবে পাঠানো হয়েছে"
            : "Payment confirmation SMS sent successfully"
        );
        loadFees();
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "এসএমএস পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const handleEdit = (fee: Fee) => {
    setSelectedFee(fee);
    setFeeForm({
      admissionId:
        typeof fee.admissionId === "string"
          ? fee.admissionId
          : fee.admissionId._id,
      monthlyFee: fee.monthlyFee.toString(),
      dueDate: new Date(fee.dueDate).toISOString().split("T")[0],
      month: fee.month.toString(),
      year: fee.year.toString(),
      notes: fee.notes || "",
    });
    setViewMode("edit");
  };

  const handleMarkPayment = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentForm({
      amountPaid: fee.amountPaid.toString(),
      paymentDate: fee.paymentDate
        ? new Date(fee.paymentDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      paymentMethod: (fee.paymentMethod as any) || "cash",
      transactionId: fee.transactionId || "",
      sendSms: !fee.paymentSmsSent,
    });
    setViewMode("payment");
  };

  const filteredFees = fees.filter((fee) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        fee.studentName.toLowerCase().includes(searchLower) ||
        fee.studentId?.toLowerCase().includes(searchLower) ||
        fee.monthlyFee.toString().includes(searchLower)
      );
    }
    return true;
  });

  const getMonthName = (month: number, lang: string) => {
    const months = lang === "bn"
      ? [
          "জানুয়ারি",
          "ফেব্রুয়ারি",
          "মার্চ",
          "এপ্রিল",
          "মে",
          "জুন",
          "জুলাই",
          "আগস্ট",
          "সেপ্টেম্বর",
          "অক্টোবর",
          "নভেম্বর",
          "ডিসেম্বর",
        ]
      : [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
    return months[month - 1] || "";
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1
            className={`text-3xl font-bold mb-2 transition-colors duration-200 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            {language === "bn" ? "মাসিক ফি ব্যবস্থাপনা" : "Tuition Fee Management"}
          </h1>
          <p
            className={`text-sm transition-colors duration-200 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {language === "bn"
              ? "মাসিক ফি রেকর্ড, পেমেন্ট ট্র্যাকিং এবং এসএমএস নোটিফিকেশন"
              : "Monthly fee records, payment tracking, and SMS notifications"}
          </p>
        </div>

        {viewMode === "list" && (
          <>
            {/* Actions Bar */}
            <div
              className={`p-4 rounded-xl shadow-md mb-6 transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex-1 w-full md:w-auto">
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={
                        language === "bn"
                          ? "ছাত্রের নাম, আইডি..."
                          : "Search student name, ID..."
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

                <div className="flex gap-2 flex-wrap">
                  <select
                    value={filters.month || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        month: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">
                      {language === "bn" ? "সব মাস" : "All Months"}
                    </option>
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1, language)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={filters.year || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        year: e.target.value ? parseInt(e.target.value) : undefined,
                      })
                    }
                    placeholder={language === "bn" ? "বছর" : "Year"}
                    min="2000"
                    max="2100"
                    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all w-24 ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />

                  <select
                    value={filters.class || ""}
                    onChange={(e) =>
                      setFilters({ ...filters, class: e.target.value || undefined })
                    }
                    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">
                      {language === "bn" ? "সব ক্লাস" : "All Classes"}
                    </option>
                    {Array.from({ length: 10 }, (_, i) => (
                      <option key={i + 1} value={`Class ${i + 1}`}>
                        {language === "bn" ? "ক্লাস" : "Class"} {i + 1}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.status || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFilters({
                        ...filters,
                        status: value
                          ? (value as "pending" | "paid" | "overdue" | "partial")
                          : undefined,
                      });
                    }}
                    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">
                      {language === "bn" ? "সব স্ট্যাটাস" : "All Status"}
                    </option>
                    <option value="pending">
                      {language === "bn" ? "বকেয়া" : "Pending"}
                    </option>
                    <option value="paid">
                      {language === "bn" ? "পরিশোধিত" : "Paid"}
                    </option>
                    <option value="overdue">
                      {language === "bn" ? "মেয়াদ উত্তীর্ণ" : "Overdue"}
                    </option>
                    <option value="partial">
                      {language === "bn" ? "আংশিক" : "Partial"}
                    </option>
                  </select>

                  <button
                    onClick={() => {
                      setViewMode("create");
                      setFeeForm({
                        admissionId: "",
                        monthlyFee: "",
                        dueDate: "",
                        month: (new Date().getMonth() + 1).toString(),
                        year: new Date().getFullYear().toString(),
                        notes: "",
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <FaPlus />
                    {language === "bn" ? "নতুন ফি" : "New Fee"}
                  </button>

                  <button
                    onClick={() => {
                      setBulkForm({
                        month: (new Date().getMonth() + 1).toString(),
                        year: new Date().getFullYear().toString(),
                        dueDate: "",
                        class: filters.class || "",
                        batchName: "",
                      });
                      setViewMode("bulk");
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <FaPlus />
                    {language === "bn" ? "বাল্ক ফি" : "Bulk Fee"}
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div
                  className={`p-4 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {language === "bn" ? "মোট ফি" : "Total Fee"}
                  </p>
                  <p
                    className={`text-2xl font-bold transition-colors duration-200 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    ৳{stats.totalAmount?.toLocaleString() || "0"}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {language === "bn" ? "পরিশোধিত" : "Paid"}
                  </p>
                  <p
                    className={`text-2xl font-bold text-green-600 transition-colors duration-200 ${
                      isDarkMode ? "text-green-400" : ""
                    }`}
                  >
                    ৳{stats.totalPaid?.toLocaleString() || "0"}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {language === "bn" ? "বকেয়া" : "Due"}
                  </p>
                  <p
                    className={`text-2xl font-bold text-red-600 transition-colors duration-200 ${
                      isDarkMode ? "text-red-400" : ""
                    }`}
                  >
                    ৳{stats.totalDue?.toLocaleString() || "0"}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <p
                    className={`text-sm mb-1 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {language === "bn" ? "সংগ্রহ হার" : "Collection Rate"}
                  </p>
                  <p
                    className={`text-2xl font-bold text-blue-600 transition-colors duration-200 ${
                      isDarkMode ? "text-blue-400" : ""
                    }`}
                  >
                    {stats.collectionRate || "0"}%
                  </p>
                </div>
              </div>
            )}

            {/* Fees Table */}
            <div
              className={`rounded-xl shadow-md overflow-hidden transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead
                    className={`transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <tr>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "ছাত্র আইডি" : "Student ID"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "ছাত্রের নাম" : "Student Name"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "মাস" : "Month"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "মাসিক ফি" : "Monthly Fee"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "পরিশোধিত" : "Paid"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "বকেয়া" : "Due"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "পরিশোধের তারিখ" : "Due Date"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "স্ট্যাটাস" : "Status"}
                      </th>
                      <th
                        className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "কর্ম" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredFees.map((fee) => {
                      const admission =
                        typeof fee.admissionId === "string"
                          ? null
                          : fee.admissionId;
                      const isOverdue =
                        fee.status === "overdue" ||
                        (fee.status === "pending" &&
                          new Date(fee.dueDate) < new Date());

                      return (
                        <tr
                          key={fee._id}
                          className={`transition-colors duration-200 ${
                            isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                          } ${isOverdue ? "bg-red-50 dark:bg-red-900/10" : ""}`}
                        >
                          <td
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {fee.studentId || "-"}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {fee.studentName}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {getMonthName(fee.month, language)} {fee.year}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-semibold transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            ৳{fee.monthlyFee.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-green-600 font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-green-400" : ""
                            }`}
                          >
                            ৳{fee.amountPaid.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-red-600 font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-red-400" : ""
                            }`}
                          >
                            ৳{fee.amountDue.toLocaleString()}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {new Date(fee.dueDate).toLocaleDateString(
                              language === "bn" ? "bn-BD" : "en-US"
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                fee.status === "paid"
                                  ? "bg-green-100 text-green-800 " +
                                    (isDarkMode
                                      ? "dark:bg-green-900/30 dark:text-green-400"
                                      : "")
                                  : fee.status === "overdue"
                                  ? "bg-red-100 text-red-800 " +
                                    (isDarkMode
                                      ? "dark:bg-red-900/30 dark:text-red-400"
                                      : "")
                                  : fee.status === "partial"
                                  ? "bg-yellow-100 text-yellow-800 " +
                                    (isDarkMode
                                      ? "dark:bg-yellow-900/30 dark:text-yellow-400"
                                      : "")
                                  : "bg-gray-100 text-gray-800 " +
                                    (isDarkMode
                                      ? "dark:bg-gray-700 dark:text-gray-300"
                                      : "")
                              }`}
                            >
                              {fee.status === "paid"
                                ? language === "bn"
                                  ? "পরিশোধিত"
                                  : "Paid"
                                : fee.status === "overdue"
                                ? language === "bn"
                                  ? "মেয়াদ উত্তীর্ণ"
                                  : "Overdue"
                                : fee.status === "partial"
                                ? language === "bn"
                                  ? "আংশিক"
                                  : "Partial"
                                : language === "bn"
                                ? "বকেয়া"
                                : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleMarkPayment(fee)}
                                className={`p-2 rounded-lg transition-all ${
                                  isDarkMode
                                    ? "text-blue-400 hover:bg-gray-700"
                                    : "text-blue-600 hover:bg-blue-50"
                                }`}
                                title={
                                  language === "bn" ? "পেমেন্ট" : "Payment"
                                }
                              >
                                <FaMoneyBillWave />
                              </button>
                              {fee.status === "paid" && !fee.paymentSmsSent && (
                                <button
                                  onClick={() => handleSendPaymentSMS(fee._id)}
                                  disabled={isPending}
                                  className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                    isDarkMode
                                      ? "text-green-400 hover:bg-gray-700"
                                      : "text-green-600 hover:bg-green-50"
                                  }`}
                                  title={
                                    language === "bn"
                                      ? "পেমেন্ট এসএমএস"
                                      : "Payment SMS"
                                  }
                                >
                                  <FaSms />
                                </button>
                              )}
                              {fee.status !== "paid" && !fee.reminderSmsSent && (
                                <button
                                  onClick={() => handleSendReminderSMS(fee._id)}
                                  disabled={isPending}
                                  className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                    isDarkMode
                                      ? "text-yellow-400 hover:bg-gray-700"
                                      : "text-yellow-600 hover:bg-yellow-50"
                                  }`}
                                  title={
                                    language === "bn"
                                      ? "অনুস্মারক এসএমএস"
                                      : "Reminder SMS"
                                  }
                                >
                                  <FaSms />
                                </button>
                              )}
                              {fee.status === "overdue" && !fee.overdueSmsSent && (
                                <button
                                  onClick={() => handleSendOverdueSMS(fee._id)}
                                  disabled={isPending}
                                  className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                    isDarkMode
                                      ? "text-red-400 hover:bg-gray-700"
                                      : "text-red-600 hover:bg-red-50"
                                  }`}
                                  title={
                                    language === "bn"
                                      ? "বকেয়া এসএমএস"
                                      : "Overdue SMS"
                                  }
                                >
                                  <FaExclamationTriangle />
                                </button>
                              )}
                              <button
                                onClick={() => handleEdit(fee)}
                                className={`p-2 rounded-lg transition-all ${
                                  isDarkMode
                                    ? "text-yellow-400 hover:bg-gray-700"
                                    : "text-yellow-600 hover:bg-yellow-50"
                                }`}
                                title={language === "bn" ? "সম্পাদনা" : "Edit"}
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDeleteFee(fee._id)}
                                disabled={isPending}
                                className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                  isDarkMode
                                    ? "text-red-400 hover:bg-gray-700"
                                    : "text-red-600 hover:bg-red-50"
                                }`}
                                title={language === "bn" ? "মুছুন" : "Delete"}
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {(viewMode === "create" || viewMode === "edit") && (
          <div
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {viewMode === "create"
                ? language === "bn"
                  ? "নতুন ফি রেকর্ড তৈরি করুন"
                  : "Create New Fee Record"
                : language === "bn"
                ? "ফি রেকর্ড সম্পাদনা করুন"
                : "Edit Fee Record"}
            </h2>

            <form onSubmit={handleCreateFee} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "ছাত্র নির্বাচন করুন" : "Select Student"} *
                  </label>
                  <select
                    value={feeForm.admissionId}
                    onChange={(e) => {
                      setFeeForm({ ...feeForm, admissionId: e.target.value });
                      const selectedAdm = admissions.find(
                        (a) => a._id === e.target.value
                      );
                      if (selectedAdm) {
                        setFeeForm({
                          ...feeForm,
                          admissionId: e.target.value,
                          monthlyFee: selectedAdm.monthlyFee.toString(),
                        });
                      }
                    }}
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">
                      {language === "bn"
                        ? "ছাত্র নির্বাচন করুন"
                        : "Select a student"}
                    </option>
                    {admissions.map((adm) => (
                      <option key={adm._id} value={adm._id}>
                        {adm.studentName} ({adm.studentId || "N/A"}) - {adm.class}
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
                    {language === "bn" ? "মাসিক ফি" : "Monthly Fee"} *
                  </label>
                  <input
                    type="number"
                    value={feeForm.monthlyFee}
                    onChange={(e) =>
                      setFeeForm({ ...feeForm, monthlyFee: e.target.value })
                    }
                    required
                    min="0"
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                    {language === "bn" ? "মাস" : "Month"} *
                  </label>
                  <select
                    value={feeForm.month}
                    onChange={(e) =>
                      setFeeForm({ ...feeForm, month: e.target.value })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1, language)}
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
                    {language === "bn" ? "বছর" : "Year"} *
                  </label>
                  <input
                    type="number"
                    value={feeForm.year}
                    onChange={(e) =>
                      setFeeForm({ ...feeForm, year: e.target.value })
                    }
                    required
                    min="2000"
                    max="2100"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                    {language === "bn" ? "পরিশোধের তারিখ" : "Due Date"} *
                  </label>
                  <input
                    type="date"
                    value={feeForm.dueDate}
                    onChange={(e) =>
                      setFeeForm({ ...feeForm, dueDate: e.target.value })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {language === "bn" ? "নোট" : "Notes"}
                </label>
                <textarea
                  value={feeForm.notes}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, notes: e.target.value })
                  }
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                />
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    setSelectedFee(null);
                  }}
                  className={`px-6 py-2 border rounded-lg font-medium transition-colors duration-200 ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                      : "border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {language === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending
                    ? language === "bn"
                      ? "সংরক্ষণ করা হচ্ছে..."
                      : "Saving..."
                    : language === "bn"
                    ? "সংরক্ষণ করুন"
                    : "Save"}
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === "bulk" && (
          <div
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {language === "bn" ? "বাল্ক ফি তৈরি করুন" : "Create Bulk Fees"}
            </h2>

            <form onSubmit={handleCreateBulkFees} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "মাস" : "Month"} *
                  </label>
                  <select
                    value={bulkForm.month}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, month: e.target.value })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1, language)}
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
                    {language === "bn" ? "বছর" : "Year"} *
                  </label>
                  <input
                    type="number"
                    value={bulkForm.year}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, year: e.target.value })
                    }
                    required
                    min="2000"
                    max="2100"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                    {language === "bn" ? "পরিশোধের তারিখ" : "Due Date"} *
                  </label>
                  <input
                    type="date"
                    value={bulkForm.dueDate}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, dueDate: e.target.value })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                    {language === "bn" ? "ক্লাস" : "Class"}
                  </label>
                  <select
                    value={bulkForm.class}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, class: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">
                      {language === "bn" ? "সব ক্লাস" : "All Classes"}
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
                    value={bulkForm.batchName}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, batchName: e.target.value })
                    }
                    placeholder={
                      language === "bn" ? "ব্যাচ নাম" : "Batch name"
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    setBulkForm({
                      month: (new Date().getMonth() + 1).toString(),
                      year: new Date().getFullYear().toString(),
                      dueDate: "",
                      class: "",
                      batchName: "",
                    });
                  }}
                  className={`px-6 py-2 border rounded-lg font-medium transition-colors duration-200 ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                      : "border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {language === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending
                    ? language === "bn"
                      ? "তৈরি করা হচ্ছে..."
                      : "Creating..."
                    : language === "bn"
                    ? "বাল্ক ফি তৈরি করুন"
                    : "Create Bulk Fees"}
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === "payment" && selectedFee && (
          <div
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <h2
              className={`text-xl font-semibold mb-4 transition-colors duration-200 ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              {language === "bn" ? "পেমেন্ট রেকর্ড করুন" : "Record Payment"}
            </h2>

            <div className="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <p
                className={`text-sm mb-2 transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {language === "bn" ? "ছাত্র" : "Student"}:{" "}
                <span className="font-medium">{selectedFee.studentName}</span>
              </p>
              <p
                className={`text-sm mb-2 transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {language === "bn" ? "মাসিক ফি" : "Monthly Fee"}:{" "}
                <span className="font-medium">
                  ৳{selectedFee.monthlyFee.toLocaleString()}
                </span>
              </p>
              <p
                className={`text-sm transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {language === "bn" ? "বকেয়া" : "Due"}:{" "}
                <span className="font-medium text-red-600 dark:text-red-400">
                  ৳{selectedFee.amountDue.toLocaleString()}
                </span>
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdatePayment(selectedFee._id);
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "পরিশোধিত পরিমাণ" : "Amount Paid"} *
                  </label>
                  <input
                    type="number"
                    value={paymentForm.amountPaid}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        amountPaid: e.target.value,
                      })
                    }
                    required
                    min="0"
                    max={selectedFee.monthlyFee}
                    step="0.01"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                    {language === "bn" ? "পেমেন্ট তারিখ" : "Payment Date"} *
                  </label>
                  <input
                    type="date"
                    value={paymentForm.paymentDate}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentDate: e.target.value,
                      })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
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
                    {language === "bn" ? "পেমেন্ট পদ্ধতি" : "Payment Method"}
                  </label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentMethod: e.target.value as any,
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="cash">
                      {language === "bn" ? "নগদ" : "Cash"}
                    </option>
                    <option value="bank">
                      {language === "bn" ? "ব্যাংক" : "Bank"}
                    </option>
                    <option value="mobile_banking">
                      {language === "bn" ? "মোবাইল ব্যাংকিং" : "Mobile Banking"}
                    </option>
                    <option value="other">
                      {language === "bn" ? "অন্যান্য" : "Other"}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "ট্রানজেকশন আইডি" : "Transaction ID"}
                  </label>
                  <input
                    type="text"
                    value={paymentForm.transactionId}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        transactionId: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={paymentForm.sendSms}
                  onChange={(e) =>
                    setPaymentForm({
                      ...paymentForm,
                      sendSms: e.target.checked,
                    })
                  }
                  className={`rounded transition-colors duration-200 ${
                    isDarkMode ? "border-gray-600" : "border-gray-300"
                  }`}
                />
                <label
                  className={`text-sm transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {language === "bn"
                    ? "অভিভাবকের কাছে পেমেন্ট কনফার্মেশন এসএমএস পাঠান"
                    : "Send payment confirmation SMS to parent"}
                </label>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    setSelectedFee(null);
                  }}
                  className={`px-6 py-2 border rounded-lg font-medium transition-colors duration-200 ${
                    isDarkMode
                      ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                      : "border-gray-300 hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  {language === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending
                    ? language === "bn"
                      ? "সংরক্ষণ করা হচ্ছে..."
                      : "Saving..."
                    : language === "bn"
                    ? "পেমেন্ট সংরক্ষণ করুন"
                    : "Save Payment"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

