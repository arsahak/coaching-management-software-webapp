"use client";

import {
  createFee,
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
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaBell,
  FaCheck,
  FaChevronDown,
  FaExclamationTriangle,
  FaFilter,
  FaMoneyBillWave,
  FaSearch,
  FaSms,
  FaTrash,
  FaUsers,
  FaTimes,
  FaCheckSquare,
  FaSquare,
} from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FeeRecord {
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

interface AdmissionRecord {
  _id: string;
  studentName: string;
  studentId?: string;
  class: string;
  batchName: string;
  monthlyFee: number;
  fatherMobile: string;
  motherMobile?: string;
  status: string;
}

interface StudentFeeRow {
  admissionId: string;
  studentName: string;
  studentId?: string;
  class: string;
  batchName: string;
  monthlyFee: number;
  contactMobile: string;
  feeRecord: FeeRecord | null;
}

type ViewMode = "list" | "payment";

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_BN = ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TuitionFeeManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const [isPending, startTransition] = useTransition();

  const curMonth = new Date().getMonth() + 1;
  const curYear  = new Date().getFullYear();

  // ── state ──
  const [admissions, setAdmissions]     = useState<AdmissionRecord[]>([]);
  const [feeRecords, setFeeRecords]     = useState<FeeRecord[]>([]);
  const [stats, setStats]               = useState<any>(null);
  const [search, setSearch]             = useState("");
  const [filterClass, setFilterClass]   = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterMonth, setFilterMonth]   = useState(curMonth);
  const [filterYear, setFilterYear]     = useState(curYear);
  const [viewMode, setViewMode]         = useState<ViewMode>("list");
  const [selectedRow, setSelectedRow]   = useState<StudentFeeRow | null>(null);

  // ── bulk selection ──
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkSending, setBulkSending] = useState(false);
  const [smsDropdownOpen, setSmsDropdownOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    amountPaid:    "",
    paymentDate:   new Date().toISOString().split("T")[0],
    paymentMethod: "cash" as "cash" | "bank" | "mobile_banking" | "other",
    transactionId: "",
    sendSms:       true,
  });

  // ── load data ──
  useEffect(() => { loadData(); }, [filterMonth, filterYear, filterClass]);

  const loadData = () => {
    startTransition(async () => {
      const [admRes, feeRes, statsRes] = await Promise.all([
        getAdmissions(1, 1000, "", { status: "active", class: filterClass || undefined }),
        getFees(1, 2000, { month: filterMonth, year: filterYear, class: filterClass || undefined }),
        getFeeStats(filterMonth, filterYear, filterClass || undefined),
      ]);
      if (admRes.success && admRes.data)     setAdmissions((Array.isArray(admRes.data)  ? admRes.data  : []) as AdmissionRecord[]);
      if (feeRes.success && feeRes.data)     setFeeRecords ((Array.isArray(feeRes.data)  ? feeRes.data  : []) as FeeRecord[]);
      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      setSelectedIds(new Set()); // clear selection on reload
    });
  };

  // ── merge admissions + fee records ──
  const merged: StudentFeeRow[] = admissions.map((adm) => {
    const fee = feeRecords.find((f) => {
      const fAdmId = typeof f.admissionId === "string" ? f.admissionId : f.admissionId?._id;
      return fAdmId === adm._id;
    }) || null;
    return {
      admissionId:   adm._id,
      studentName:   adm.studentName,
      studentId:     adm.studentId,
      class:         adm.class,
      batchName:     adm.batchName,
      monthlyFee:    adm.monthlyFee,
      contactMobile: adm.fatherMobile || adm.motherMobile || "",
      feeRecord:     fee,
    };
  });

  // ── filtered rows ──
  const rows = merged.filter((row) => {
    if (search) {
      const q = search.toLowerCase();
      if (!row.studentName.toLowerCase().includes(q) && !(row.studentId || "").toLowerCase().includes(q)) return false;
    }
    if (filterStatus) {
      const s = row.feeRecord?.status;
      if (filterStatus === "not_paid") { if (s && s !== "pending") return false; }
      else if (filterStatus !== "not_paid" && s !== filterStatus)  return false;
      if (filterStatus !== "not_paid" && !s)                       return false;
    }
    return true;
  });

  // ── unpaid rows that have a fee record (can receive SMS) ──
  const unpaidWithRecord    = merged.filter(r => r.feeRecord && r.feeRecord.status !== "paid");
  const overdueWithRecord   = merged.filter(r => r.feeRecord && (r.feeRecord.status === "overdue" || (r.feeRecord.status === "pending" && new Date(r.feeRecord.dueDate) < new Date())));
  const paidNoSmsWithRecord = merged.filter(r => r.feeRecord && r.feeRecord.status === "paid" && !r.feeRecord.paymentSmsSent);

  const paidCount   = merged.filter(r => r.feeRecord?.status === "paid").length;
  const unpaidCount = merged.filter(r => !r.feeRecord || r.feeRecord.status !== "paid").length;

  // ── selection helpers ──
  const selectableIds = rows.map(r => r.admissionId);
  const allSelected   = selectableIds.length > 0 && selectableIds.every(id => selectedIds.has(id));
  const someSelected  = selectedIds.size > 0;

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelectedIds(new Set());
    else             setSelectedIds(new Set(selectableIds));
  };

  const selectedRows = rows.filter(r => selectedIds.has(r.admissionId));

  // ── helpers ──
  const t  = (en: string, bn: string) => language === "bn" ? bn : en;
  const mn = (m: number) => language === "bn" ? MONTHS_BN[m - 1] : MONTHS_EN[m - 1];

  const inputCls = `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
    isDarkMode
      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
  }`;

  const statusBadge = (fee: FeeRecord | null) => {
    if (!fee) return { cls: isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500", label: t("Not Paid", "পরিশোধ হয়নি") };
    switch (fee.status) {
      case "paid":    return { cls: isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800",     label: t("Paid", "পরিশোধিত") };
      case "overdue": return { cls: isDarkMode ? "bg-red-900/30 text-red-400"     : "bg-red-100 text-red-800",           label: t("Overdue", "মেয়াদ উত্তীর্ণ") };
      case "partial": return { cls: isDarkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800", label: t("Partial", "আংশিক") };
      default:        return { cls: isDarkMode ? "bg-orange-900/30 text-orange-400" : "bg-orange-100 text-orange-800", label: t("Pending", "বকেয়া") };
    }
  };

  // ── bulk SMS sender ──
  const sendBulkSMS = async (type: "reminder" | "overdue" | "payment") => {
    setSmsDropdownOpen(false);

    let targets: StudentFeeRow[];
    if (selectedRows.length > 0) {
      // When rows are selected, filter by what's relevant for that type
      targets = type === "payment"
        ? selectedRows.filter(r => r.feeRecord?.status === "paid" && !r.feeRecord.paymentSmsSent)
        : selectedRows.filter(r => r.feeRecord && r.feeRecord.status !== "paid");
    } else {
      targets = type === "overdue" ? overdueWithRecord
              : type === "payment" ? paidNoSmsWithRecord
              : unpaidWithRecord;
    }

    if (targets.length === 0) {
      toast.error(t("No eligible students to send SMS", "পাঠানোর মতো কোনো ছাত্র নেই"));
      return;
    }

    setBulkSending(true);
    let success = 0, failed = 0;

    for (const row of targets) {
      if (!row.feeRecord) continue;
      const result = type === "reminder" ? await sendPaymentReminderSMS(row.feeRecord._id)
                   : type === "overdue"  ? await sendOverdueSMS(row.feeRecord._id)
                   : await sendPaymentConfirmationSMS(row.feeRecord._id);
      result.success ? success++ : failed++;
    }

    setBulkSending(false);
    setSelectedIds(new Set());
    loadData();

    if (failed === 0)      toast.success(t(`SMS sent to ${success} students`, `${success} জন ছাত্রকে SMS পাঠানো হয়েছে`));
    else if (success > 0)  toast.success(t(`${success} sent, ${failed} failed`, `${success} সফল, ${failed} ব্যর্থ`));
    else                   toast.error(t("All SMS failed to send", "সব SMS পাঠাতে ব্যর্থ হয়েছে"));
  };

  const openPayment = (row: StudentFeeRow) => {
    setSelectedRow(row);
    setPaymentForm({
      amountPaid:    row.feeRecord?.amountPaid ? row.feeRecord.amountPaid.toString() : "",
      paymentDate:   row.feeRecord?.paymentDate
        ? new Date(row.feeRecord.paymentDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      paymentMethod: (row.feeRecord?.paymentMethod as any) || "cash",
      transactionId: row.feeRecord?.transactionId || "",
      sendSms:       !row.feeRecord?.paymentSmsSent,
    });
    setViewMode("payment");
  };

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow) return;
    startTransition(async () => {
      let feeId = selectedRow.feeRecord?._id;
      if (!feeId) {
        const dueDate = new Date(filterYear, filterMonth - 1, 10).toISOString().split("T")[0];
        const created = await createFee({ admissionId: selectedRow.admissionId, monthlyFee: selectedRow.monthlyFee, dueDate, month: filterMonth, year: filterYear });
        if (!created.success || !created.data) { toast.error(created.error || t("Failed to create fee record", "ফি রেকর্ড তৈরিতে ব্যর্থ")); return; }
        feeId = (created.data as any)._id;
      }
      const result = await updateFee(feeId!, { amountPaid: parseFloat(paymentForm.amountPaid), paymentDate: paymentForm.paymentDate, paymentMethod: paymentForm.paymentMethod, transactionId: paymentForm.transactionId || undefined, sendSms: paymentForm.sendSms });
      if (result.success) {
        toast.success(t("Payment saved", "পেমেন্ট সংরক্ষিত হয়েছে"));
        setViewMode("list"); setSelectedRow(null); loadData();
      } else {
        toast.error(result.error || t("Failed to save payment", "পেমেন্ট সংরক্ষণে ব্যর্থ"));
      }
    });
  };

  const handleDeleteFee = (feeId: string) => {
    if (!confirm(t("Delete this fee record?", "এই ফি রেকর্ড মুছবেন?"))) return;
    startTransition(async () => {
      const r = await deleteFee(feeId);
      if (r.success) { toast.success(t("Deleted", "মুছে ফেলা হয়েছে")); loadData(); }
      else toast.error(r.error || t("Failed to delete", "মুছতে ব্যর্থ"));
    });
  };

  const handleSendReminderSMS = (feeId: string) => {
    startTransition(async () => {
      const r = await sendPaymentReminderSMS(feeId);
      if (r.success) { toast.success(t("Reminder SMS sent", "অনুস্মারক SMS পাঠানো হয়েছে")); loadData(); }
      else toast.error(r.error || t("Failed to send SMS", "SMS পাঠাতে ব্যর্থ"));
    });
  };

  const handleSendOverdueSMS = (feeId: string) => {
    startTransition(async () => {
      const r = await sendOverdueSMS(feeId);
      if (r.success) { toast.success(t("Overdue SMS sent", "বকেয়া SMS পাঠানো হয়েছে")); loadData(); }
      else toast.error(r.error || t("Failed to send SMS", "SMS পাঠাতে ব্যর্থ"));
    });
  };

  const handleSendPaymentSMS = (feeId: string) => {
    startTransition(async () => {
      const r = await sendPaymentConfirmationSMS(feeId);
      if (r.success) { toast.success(t("Payment SMS sent", "পেমেন্ট SMS পাঠানো হয়েছে")); loadData(); }
      else toast.error(r.error || t("Failed to send SMS", "SMS পাঠাতে ব্যর্থ"));
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="p-6">

        {/* ══ LIST VIEW ══════════════════════════════════════════════ */}
        {viewMode === "list" && (
          <>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {t("Tuition Fee Management", "মাসিক ফি ব্যবস্থাপনা")}
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {t("All students · monthly fee status", "সকল ছাত্র · মাসিক ফি স্ট্যাটাস")}
                </p>
              </div>

              {/* Month / Year + SMS Dropdown */}
              <div className="flex items-center gap-3 mt-4 lg:mt-0 flex-wrap">
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                  className={`px-4 py-2.5 border rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "border-gray-600 bg-gray-800 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>{mn(i + 1)}</option>
                  ))}
                </select>
                <input
                  type="number" value={filterYear}
                  onChange={(e) => setFilterYear(parseInt(e.target.value) || curYear)}
                  min="2020" max="2100"
                  className={`w-24 px-3 py-2.5 border rounded-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "border-gray-600 bg-gray-800 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                />

                {/* SMS Dropdown Button */}
                <div className="relative">
                  <button
                    onClick={() => setSmsDropdownOpen(o => !o)}
                    disabled={bulkSending}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm shadow-sm transition-all duration-150 disabled:opacity-50 ${
                      isDarkMode
                        ? "bg-blue-600 hover:bg-blue-500 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                  >
                    {bulkSending
                      ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t("Sending...", "পাঠানো হচ্ছে...")}</>
                      : <><FaSms className="text-sm" /> {t("Send SMS", "SMS পাঠান")} <FaChevronDown className={`text-xs transition-transform duration-150 ${smsDropdownOpen ? "rotate-180" : ""}`} /></>
                    }
                  </button>

                  {smsDropdownOpen && (
                    <>
                      {/* backdrop */}
                      <div className="fixed inset-0 z-40" onClick={() => setSmsDropdownOpen(false)} />
                      <div className={`absolute right-0 top-full mt-2 w-72 rounded-xl shadow-xl border z-50 overflow-hidden transition-all duration-150 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>

                        {/* Section: All students */}
                        <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide ${isDarkMode ? "text-gray-500 bg-gray-700/50" : "text-gray-400 bg-gray-50"}`}>
                          {t("All Students — ", "সকল ছাত্র — ")}{mn(filterMonth)} {filterYear}
                        </div>

                        <button
                          onClick={() => { setSmsDropdownOpen(false); sendBulkSMS("reminder"); }}
                          disabled={unpaidWithRecord.length === 0}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}
                        >
                          <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-yellow-900/40 text-yellow-400" : "bg-yellow-100 text-yellow-600"}`}><FaBell className="text-xs" /></span>
                          <div>
                            <p className="font-medium">{t("Reminder SMS — All Unpaid", "অনুস্মারক SMS — সকল অপরিশোধিত")}</p>
                            <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{unpaidWithRecord.length} {t("students will receive SMS", "জন ছাত্র SMS পাবে")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { setSmsDropdownOpen(false); sendBulkSMS("overdue"); }}
                          disabled={overdueWithRecord.length === 0}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}
                        >
                          <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-red-900/40 text-red-400" : "bg-red-100 text-red-600"}`}><FaExclamationTriangle className="text-xs" /></span>
                          <div>
                            <p className="font-medium">{t("Overdue SMS — All Overdue", "বকেয়া SMS — সকল মেয়াদোত্তীর্ণ")}</p>
                            <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{overdueWithRecord.length} {t("students will receive SMS", "জন ছাত্র SMS পাবে")}</p>
                          </div>
                        </button>

                        <button
                          onClick={() => { setSmsDropdownOpen(false); sendBulkSMS("payment"); }}
                          disabled={paidNoSmsWithRecord.length === 0}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}
                        >
                          <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-600"}`}><FaCheck className="text-xs" /></span>
                          <div>
                            <p className="font-medium">{t("Payment SMS — All Paid", "পেমেন্ট SMS — সকল পরিশোধিত")}</p>
                            <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {paidNoSmsWithRecord.length} {t("paid students (SMS not yet sent)", "জন পরিশোধিত ছাত্র (SMS পাঠানো হয়নি)")}
                            </p>
                          </div>
                        </button>

                        {/* Section: Selected students */}
                        {someSelected && (
                          <>
                            <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wide border-t ${isDarkMode ? "text-gray-500 bg-gray-700/50 border-gray-700" : "text-gray-400 bg-gray-50 border-gray-100"}`}>
                              {selectedIds.size} {t("Selected Students", "জন নির্বাচিত ছাত্র")}
                            </div>
                            <button
                              onClick={() => { setSmsDropdownOpen(false); sendBulkSMS("reminder"); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}
                            >
                              <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-blue-900/40 text-blue-400" : "bg-blue-100 text-blue-600"}`}><FaBell className="text-xs" /></span>
                              <div>
                                <p className="font-medium">{t("Reminder SMS — Selected", "অনুস্মারক SMS — নির্বাচিত")}</p>
                                <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{selectedIds.size} {t("selected students", "জন নির্বাচিত")}</p>
                              </div>
                            </button>
                            <button
                              onClick={() => { setSmsDropdownOpen(false); sendBulkSMS("overdue"); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}
                            >
                              <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-orange-900/40 text-orange-400" : "bg-orange-100 text-orange-600"}`}><FaExclamationTriangle className="text-xs" /></span>
                              <div>
                                <p className="font-medium">{t("Overdue SMS — Selected", "বকেয়া SMS — নির্বাচিত")}</p>
                                <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{selectedIds.size} {t("selected students", "জন নির্বাচিত")}</p>
                              </div>
                            </button>
                            <button
                              onClick={() => { setSmsDropdownOpen(false); sendBulkSMS("payment"); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors duration-150 ${isDarkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-800"}`}
                            >
                              <span className={`p-1.5 rounded-lg ${isDarkMode ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-600"}`}><FaCheck className="text-xs" /></span>
                              <div>
                                <p className="font-medium">{t("Payment SMS — Selected Paid", "পেমেন্ট SMS — নির্বাচিত পরিশোধিত")}</p>
                                <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{selectedIds.size} {t("selected students", "জন নির্বাচিত")}</p>
                              </div>
                            </button>
                            <div className={`px-4 py-2 border-t ${isDarkMode ? "border-gray-700" : "border-gray-100"}`}>
                              <button onClick={() => { setSmsDropdownOpen(false); setSelectedIds(new Set()); }} className={`text-xs ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}>
                                {t("Clear selection", "নির্বাচন সরান")}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: t("Total Students", "মোট ছাত্র"),    value: merged.length,  color: isDarkMode ? "text-gray-100"  : "text-gray-900",  icon: <FaUsers className="text-blue-400" /> },
                { label: t("Paid", "পরিশোধিত"),               value: paidCount,      color: isDarkMode ? "text-green-400" : "text-green-600", icon: <FaCheck className="text-green-400" /> },
                { label: t("Unpaid", "অপরিশোধিত"),            value: unpaidCount,    color: isDarkMode ? "text-red-400"   : "text-red-600",   icon: <FaExclamationTriangle className="text-red-400" /> },
                { label: t("Collected", "সংগ্রহিত"),          value: `৳${(stats?.totalPaid || 0).toLocaleString()}`, color: isDarkMode ? "text-blue-400" : "text-blue-600", icon: <FaMoneyBillWave className="text-blue-400" /> },
              ].map((s) => (
                <div key={s.label} className={`p-5 rounded-xl shadow-md ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{s.label}</p>
                    {s.icon}
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Search & Filter */}
            <div className={`p-6 rounded-xl shadow-md mb-6 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center gap-2 mb-4">
                <FaFilter className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                <h2 className={`text-base font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {t("Search & Filter", "অনুসন্ধান ও ফিল্টার")}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="relative">
                  <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="text" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("Student name or ID...", "ছাত্রের নাম বা আইডি...")}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-500" : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"}`}
                  />
                </div>
                <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}>
                  <option value="">{t("All Classes", "সব ক্লাস")}</option>
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={`Class ${i + 1}`}>{t("Class", "ক্লাস")} {i + 1}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}>
                  <option value="">{t("All Status", "সব স্ট্যাটাস")}</option>
                  <option value="paid">{t("Paid", "পরিশোধিত")}</option>
                  <option value="pending">{t("Pending", "বকেয়া")}</option>
                  <option value="overdue">{t("Overdue", "মেয়াদ উত্তীর্ণ")}</option>
                  <option value="partial">{t("Partial", "আংশিক")}</option>
                  <option value="not_paid">{t("Not Paid Yet", "পরিশোধ হয়নি")}</option>
                </select>
              </div>
              <p className={`text-xs mt-3 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {rows.length} {t("students", "জন")}
                {isPending && <span className="ml-2 animate-pulse">{t("Loading...", "লোড হচ্ছে...")}</span>}
              </p>
            </div>

            {/* ── Table ──────────────────────────────────────────── */}
            <div className={`rounded-xl shadow-md overflow-hidden ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDarkMode ? "bg-gradient-to-r from-gray-700 to-gray-800" : "bg-gradient-to-r from-gray-50 to-gray-100"}`}>
                    <tr>
                      {/* Checkbox */}
                      <th className="px-4 py-4 w-10">
                        <button onClick={toggleAll} className={`transition-colors ${isDarkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}>
                          {allSelected
                            ? <FaCheckSquare className="text-blue-500 text-base" />
                            : <FaSquare className="text-base" />}
                        </button>
                      </th>
                      {[
                        t("Student", "ছাত্র"),
                        t("Class / Batch", "ক্লাস"),
                        t("Monthly Fee", "মাসিক ফি"),
                        t("Paid", "পরিশোধিত"),
                        t("Due", "বকেয়া"),
                        t("Status", "স্ট্যাটাস"),
                        t("Actions", "কর্ম"),
                      ].map((h) => (
                        <th key={h} className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-100"}`}>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-14 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                              <FaUsers className={`text-xl ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                            </div>
                            <p className={`font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{t("No students found", "কোন ছাত্র পাওয়া যায়নি")}</p>
                            <p className={`text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{t("Add students via Admission Management", "ভর্তি ব্যবস্থাপনা থেকে ছাত্র যোগ করুন")}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => {
                        const { cls: badgeCls, label: badgeLabel } = statusBadge(row.feeRecord);
                        const fee    = row.feeRecord;
                        const isLate = fee && (fee.status === "overdue" || (fee.status === "pending" && new Date(fee.dueDate) < new Date()));
                        const isSelected = selectedIds.has(row.admissionId);

                        return (
                          <tr
                            key={row.admissionId}
                            className={`transition-colors duration-150 ${
                              isSelected
                                ? isDarkMode ? "bg-blue-900/20" : "bg-blue-50"
                                : isLate
                                ? isDarkMode ? "bg-red-900/10 hover:bg-red-900/20" : "bg-red-50/40 hover:bg-red-50"
                                : fee?.status === "paid"
                                ? isDarkMode ? "bg-green-900/5 hover:bg-green-900/10" : "bg-green-50/20 hover:bg-green-50"
                                : isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="px-4 py-4">
                              <button onClick={() => toggleRow(row.admissionId)} className={`transition-colors ${isDarkMode ? "text-gray-500 hover:text-blue-400" : "text-gray-400 hover:text-blue-500"}`}>
                                {isSelected
                                  ? <FaCheckSquare className="text-blue-500 text-base" />
                                  : <FaSquare className="text-base" />}
                              </button>
                            </td>
                            {/* Student */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className={`text-sm font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>{row.studentName}</p>
                              {row.studentId && <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{row.studentId}</p>}
                            </td>
                            {/* Class */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{row.class}</p>
                              <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>{row.batchName}</p>
                            </td>
                            {/* Monthly Fee */}
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                              ৳{row.monthlyFee.toLocaleString()}
                            </td>
                            {/* Paid */}
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                              {fee ? `৳${fee.amountPaid.toLocaleString()}` : <span className={isDarkMode ? "text-gray-600" : "text-gray-300"}>—</span>}
                            </td>
                            {/* Due */}
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                              {fee
                                ? (fee.amountDue > 0 ? `৳${fee.amountDue.toLocaleString()}` : <span className={isDarkMode ? "text-gray-600" : "text-gray-300"}>—</span>)
                                : `৳${row.monthlyFee.toLocaleString()}`}
                            </td>
                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${badgeCls}`}>
                                {badgeLabel}
                              </span>
                            </td>
                                {/* Actions */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    {/* Mark Payment */}
                                    <button onClick={() => openPayment(row)}
                                      className={`p-2 rounded-lg transition-colors duration-150 ${isDarkMode ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}`}
                                      title={t("Record Payment", "পেমেন্ট রেকর্ড")}>
                                      <FaMoneyBillWave className="text-base" />
                                    </button>

                                    {/* Individual SMS — smart: shows most relevant action */}
                                    {fee && fee.status !== "paid" && (
                                      <button
                                        onClick={() => isLate || fee.status === "overdue"
                                          ? handleSendOverdueSMS(fee._id)
                                          : handleSendReminderSMS(fee._id)
                                        }
                                        disabled={isPending || (isLate ? !!fee.overdueSmsSent : !!fee.reminderSmsSent)}
                                        className={`p-2 rounded-lg transition-colors duration-150 disabled:opacity-30 ${
                                          isLate || fee.status === "overdue"
                                            ? isDarkMode ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                            : isDarkMode ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20" : "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                        }`}
                                        title={isLate || fee.status === "overdue"
                                          ? t("Send Overdue SMS", "বকেয়া SMS পাঠান")
                                          : t("Send Reminder SMS", "অনুস্মারক SMS পাঠান")
                                        }
                                      >
                                        <FaSms className="text-base" />
                                      </button>
                                    )}

                                    {/* Payment Confirmation SMS (paid) */}
                                    {fee?.status === "paid" && !fee.paymentSmsSent && (
                                      <button onClick={() => handleSendPaymentSMS(fee._id)} disabled={isPending}
                                        className={`p-2 rounded-lg transition-colors duration-150 disabled:opacity-50 ${isDarkMode ? "text-green-400 hover:text-green-300 hover:bg-green-900/20" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
                                        title={t("Payment Confirmation SMS", "পেমেন্ট SMS")}>
                                        <FaSms className="text-base" />
                                      </button>
                                    )}

                                    {/* Delete record */}
                                    {fee && (
                                      <button onClick={() => handleDeleteFee(fee._id)} disabled={isPending}
                                        className={`p-2 rounded-lg transition-colors duration-150 disabled:opacity-50 ${isDarkMode ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : "text-red-500 hover:text-red-700 hover:bg-red-50"}`}
                                        title={t("Delete", "মুছুন")}>
                                        <FaTrash className="text-base" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              {rows.length > 0 && (
                <div className={`px-6 py-3 flex flex-wrap items-center justify-between gap-4 border-t text-sm ${isDarkMode ? "border-gray-700 bg-gray-700/20 text-gray-400" : "border-gray-100 bg-gray-50 text-gray-500"}`}>
                  <span>
                    {someSelected
                      ? t(`${selectedIds.size} of ${rows.length} selected`, `${rows.length} জনের মধ্যে ${selectedIds.size} জন নির্বাচিত`)
                      : `${rows.length} ${t("students", "জন")} · ${mn(filterMonth)} ${filterYear}`}
                  </span>
                  <div className="flex items-center gap-6">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                      {t("Paid", "পরিশোধিত")}: <span className={`font-semibold ml-1 ${isDarkMode ? "text-green-400" : "text-green-600"}`}>{paidCount}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      {t("Unpaid", "অপরিশোধিত")}: <span className={`font-semibold ml-1 ${isDarkMode ? "text-red-400" : "text-red-600"}`}>{unpaidCount}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* ── Floating selection bar ──────────────────────────── */}
            {someSelected && (
              <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}>
                <div className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? "bg-blue-900/40 text-blue-300" : "bg-blue-100 text-blue-700"}`}>
                  {selectedIds.size} {t("selected", "নির্বাচিত")}
                </div>
                <div className={`w-px h-5 ${isDarkMode ? "bg-gray-600" : "bg-gray-200"}`} />
                <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {t("Send SMS →", "SMS পাঠান →")}
                </span>
                <button onClick={() => sendBulkSMS("reminder")} disabled={bulkSending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 disabled:opacity-50 ${isDarkMode ? "bg-yellow-900/40 text-yellow-300 hover:bg-yellow-900/60" : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100"}`}>
                  <FaBell className="text-xs" /> {t("Reminder", "অনুস্মারক")}
                </button>
                <button onClick={() => sendBulkSMS("overdue")} disabled={bulkSending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 disabled:opacity-50 ${isDarkMode ? "bg-red-900/40 text-red-300 hover:bg-red-900/60" : "bg-red-50 text-red-700 hover:bg-red-100"}`}>
                  <FaExclamationTriangle className="text-xs" /> {t("Overdue", "বকেয়া")}
                </button>
                <button onClick={() => setSelectedIds(new Set())}
                  className={`p-1.5 rounded-lg transition-colors duration-150 ${isDarkMode ? "text-gray-500 hover:bg-gray-700" : "text-gray-400 hover:bg-gray-100"}`}>
                  <FaTimes className="text-xs" />
                </button>
              </div>
            )}
          </>
        )}

        {/* ══ PAYMENT VIEW ═══════════════════════════════════════════ */}
        {viewMode === "payment" && selectedRow && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setViewMode("list"); setSelectedRow(null); }}
                className={`p-2.5 rounded-lg transition-colors duration-150 ${isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className={`text-3xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>{t("Record Payment", "পেমেন্ট রেকর্ড করুন")}</h1>
                <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{selectedRow.studentName} · {mn(filterMonth)} {filterYear}</p>
              </div>
            </div>

            {/* Student summary */}
            <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-xs font-semibold uppercase tracking-wide mb-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{t("Student Details", "ছাত্রের বিবরণ")}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t("Name", "নাম"),             value: selectedRow.studentName },
                  { label: t("Class / Batch", "ক্লাস"),  value: `${selectedRow.class} · ${selectedRow.batchName}` },
                  { label: t("Monthly Fee", "মাসিক ফি"), value: `৳${selectedRow.monthlyFee.toLocaleString()}` },
                  { label: t("Already Paid", "পরিশোধিত"), value: `৳${(selectedRow.feeRecord?.amountPaid || 0).toLocaleString()}`, color: isDarkMode ? "text-green-400" : "text-green-600" },
                ].map((s) => (
                  <div key={s.label} className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{s.label}</p>
                    <p className={`text-sm font-semibold ${s.color || (isDarkMode ? "text-gray-200" : "text-gray-800")}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              {!selectedRow.feeRecord && (
                <div className={`mt-4 flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${isDarkMode ? "bg-blue-900/20 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                  <FaCheck className="shrink-0" />
                  {t("A fee record will be auto-created when you save.", "সংরক্ষণ করলে ফি রেকর্ড স্বয়ংক্রিয়ভাবে তৈরি হবে।")}
                </div>
              )}
            </div>

            {/* Payment form */}
            <div className={`p-6 rounded-xl shadow-md ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <h2 className={`text-base font-semibold mb-6 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>{t("Payment Details", "পেমেন্টের বিবরণ")}</h2>
              <form onSubmit={handleSavePayment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{t("Amount Paid", "পরিশোধিত পরিমাণ")} <span className="text-red-500">*</span></label>
                    <input type="number" value={paymentForm.amountPaid} onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })} required min="0" max={selectedRow.monthlyFee} step="1" placeholder={`0 – ৳${selectedRow.monthlyFee}`} className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{t("Payment Date", "পেমেন্টের তারিখ")} <span className="text-red-500">*</span></label>
                    <input type="date" value={paymentForm.paymentDate} onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })} required className={inputCls} />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{t("Payment Method", "পেমেন্ট পদ্ধতি")}</label>
                    <select value={paymentForm.paymentMethod} onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })} className={inputCls}>
                      <option value="cash">{t("Cash", "নগদ")}</option>
                      <option value="bank">{t("Bank Transfer", "ব্যাংক")}</option>
                      <option value="mobile_banking">{t("Mobile Banking", "মোবাইল ব্যাংকিং")}</option>
                      <option value="other">{t("Other", "অন্যান্য")}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{t("Transaction ID", "ট্রানজেকশন আইডি")}</label>
                    <input type="text" value={paymentForm.transactionId} onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })} placeholder={t("Optional", "ঐচ্ছিক")} className={inputCls} />
                  </div>
                </div>
                <div className={`flex items-center gap-3 p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-green-50"}`}>
                  <input type="checkbox" id="sendSms" checked={paymentForm.sendSms} onChange={(e) => setPaymentForm({ ...paymentForm, sendSms: e.target.checked })} className="w-4 h-4 rounded accent-green-600" />
                  <label htmlFor="sendSms" className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    <FaSms className={isDarkMode ? "text-green-400" : "text-green-600"} />
                    {t("Send payment confirmation SMS to parent", "অভিভাবকের কাছে পেমেন্ট কনফার্মেশন SMS পাঠান")}
                  </label>
                </div>
                <div className={`flex gap-3 justify-end pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <button type="button" onClick={() => { setViewMode("list"); setSelectedRow(null); }}
                    className={`px-6 py-2.5 border rounded-lg font-medium transition-colors duration-200 ${isDarkMode ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}>
                    {t("Cancel", "বাতিল")}
                  </button>
                  <button type="submit" disabled={isPending}
                    className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200">
                    {isPending ? t("Saving...", "সংরক্ষণ হচ্ছে...") : t("Save Payment", "পেমেন্ট সংরক্ষণ করুন")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
