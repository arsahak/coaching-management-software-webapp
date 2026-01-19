"use client";

import { getAdmissions } from "@/app/actions/admission";
import {
  getAttendanceStats,
  getAttendances,
  getStudentAttendanceReport,
  markAttendance,
  markBatchAttendance,
  sendAttendanceReportSMS,
} from "@/app/actions/attendance";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { FaCheck, FaSearch, FaSms, FaTimes } from "react-icons/fa";

interface Admission {
  _id: string;
  studentName: string;
  studentId?: string;
  class: string;
  batchName: string;
  fatherMobile: string;
  motherMobile?: string;
  alarmMobile?: string[];
  status: "active" | "inactive" | "completed";
}

interface Attendance {
  _id: string;
  admissionId: string | Admission;
  studentId?: string;
  studentName: string;
  date: string;
  status: "present" | "absent";
  smsSent: boolean;
  smsRecipients?: string[];
  notes?: string;
}

interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  presentPercentage: string;
  absentPercentage: string;
}

export default function StudentAttendanceManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, "present" | "absent">
  >({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    class?: string;
    batch?: string;
    status?: string;
  }>({});
  const [viewMode, setViewMode] = useState<"daily" | "report">("daily");
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [reportPeriod, setReportPeriod] = useState<"week" | "month">("month");
  const [reportData, setReportData] = useState<any>(null);

  // Load admissions
  useEffect(() => {
    loadAdmissions();
  }, [filters, search, viewMode]);

  // Load attendance for selected date
  useEffect(() => {
    if (viewMode === "daily" && selectedDate) {
      loadAttendance();
      loadStats();
    }
  }, [selectedDate, filters, viewMode]);

  const loadAdmissions = async () => {
    startTransition(async () => {
      const result = await getAdmissions(1, 1000, search, {
        class: filters.class,
        batch: filters.batch,
        status: filters.status || "active",
      });

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setAdmissions(data as Admission[]);

        // Initialize attendance map
        const map: Record<string, "present" | "absent"> = {};
        data.forEach((adm: Admission) => {
          map[adm._id] = "present"; // Default to present
        });
        setAttendanceMap(map);
      }
    });
  };

  const loadAttendance = async () => {
    startTransition(async () => {
      const startDate = selectedDate;
      const endDate = selectedDate;

      const result = await getAttendances(1, 1000, {
        startDate,
        endDate,
        class: filters.class,
        batchName: filters.batch,
      });

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setAttendances(data as Attendance[]);

        // Update attendance map
        const map: Record<string, "present" | "absent"> = {};
        data.forEach((att: Attendance) => {
          const admissionId =
            typeof att.admissionId === "string"
              ? att.admissionId
              : att.admissionId._id;
          map[admissionId] = att.status;
        });
        setAttendanceMap((prev) => ({ ...prev, ...map }));
      }
    });
  };

  const loadStats = async () => {
    startTransition(async () => {
      const startDate = selectedDate;
      const endDate = selectedDate;

      const result = await getAttendanceStats({
        startDate,
        endDate,
        class: filters.class,
        batchName: filters.batch,
      });

      if (result.success && result.data) {
        setStats(result.data as AttendanceStats);
      }
    });
  };

  const handleMarkAttendance = async (
    admissionId: string,
    status: "present" | "absent"
  ) => {
    // Update local state immediately for better UX
    setAttendanceMap((prev) => ({ ...prev, [admissionId]: status }));

    startTransition(async () => {
      const result = await markAttendance({
        admissionId,
        date: selectedDate,
        status,
      });

      if (result.success) {
        toast.success(
          language === "bn"
            ? "হাজিরা সফলভাবে রেকর্ড করা হয়েছে"
            : "Attendance marked successfully"
        );
        loadAttendance();
        loadStats();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "হাজিরা রেকর্ড করতে ব্যর্থ"
              : "Failed to mark attendance")
        );
        // Revert on error
        loadAttendance();
      }
    });
  };

  const handleBatchMark = async () => {
    const attendances = admissions
      .filter((adm) => attendanceMap[adm._id])
      .map((adm) => ({
        admissionId: adm._id,
        status: attendanceMap[adm._id],
      }));

    if (attendances.length === 0) {
      toast.error(
        language === "bn"
          ? "কোন ছাত্র নির্বাচন করা হয়নি"
          : "No students selected"
      );
      return;
    }

    startTransition(async () => {
      const result = await markBatchAttendance(selectedDate, attendances);

      if (result.success) {
        toast.success(
          language === "bn"
            ? `${attendances.length} জন ছাত্রের হাজিরা রেকর্ড করা হয়েছে`
            : `Attendance marked for ${attendances.length} student(s)`
        );
        loadAttendance();
        loadStats();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "হাজিরা রেকর্ড করতে ব্যর্থ"
              : "Failed to mark attendance")
        );
      }
    });
  };

  const handleLoadReport = async (admissionId: string) => {
    startTransition(async () => {
      const result = await getStudentAttendanceReport(
        admissionId,
        undefined,
        reportPeriod
      );

      if (result.success && result.data) {
        setReportData(result.data);
        setSelectedStudent(admissionId);
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "রিপোর্ট লোড করতে ব্যর্থ"
              : "Failed to load report")
        );
      }
    });
  };

  const handleSendReportSMS = async (admissionId: string) => {
    startTransition(async () => {
      const result = await sendAttendanceReportSMS(
        admissionId,
        undefined,
        reportPeriod
      );

      if (result.success) {
        toast.success(
          language === "bn"
            ? "এসএমএস সফলভাবে পাঠানো হয়েছে"
            : "SMS sent successfully"
        );
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "এসএমএস পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const getAttendanceForStudent = (
    admissionId: string
  ): "present" | "absent" => {
    return attendanceMap[admissionId] || "present";
  };

  const filteredAdmissions = admissions.filter((adm) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        adm.studentName.toLowerCase().includes(searchLower) ||
        adm.studentId?.toLowerCase().includes(searchLower) ||
        adm.class.toLowerCase().includes(searchLower) ||
        adm.batchName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
            {language === "bn"
              ? "ছাত্র/ছাত্রী হাজিরা ব্যবস্থাপনা"
              : "Student Attendance Management"}
          </h1>
          <p
            className={`text-sm transition-colors duration-200 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {language === "bn"
              ? "দৈনিক, সাপ্তাহিক ও মাসিক হাজিরা রেকর্ড এবং রিপোর্ট"
              : "Daily, weekly and monthly attendance records and reports"}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setViewMode("daily")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "daily"
                ? "bg-blue-600 text-white"
                : isDarkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {language === "bn" ? "দৈনিক হাজিরা" : "Daily Attendance"}
          </button>
          <button
            onClick={() => setViewMode("report")}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              viewMode === "report"
                ? "bg-blue-600 text-white"
                : isDarkMode
                ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {language === "bn" ? "রিপোর্ট" : "Reports"}
          </button>
        </div>

        {viewMode === "daily" ? (
          <>
            {/* Date Selection and Filters */}
            <div
              className={`p-4 rounded-xl shadow-md mb-6 transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "তারিখ" : "Date"}
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
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
                    value={filters.class || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        class: e.target.value || undefined,
                      })
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
                    value={filters.batch || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        batch: e.target.value || undefined,
                      })
                    }
                    placeholder={language === "bn" ? "ব্যাচ নাম" : "Batch name"}
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
                    {language === "bn" ? "অনুসন্ধান" : "Search"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder={
                        language === "bn"
                          ? "ছাত্রের নাম, আইডি..."
                          : "Student name, ID..."
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
              </div>

              {/* Batch Mark Button */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleBatchMark}
                  disabled={isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending
                    ? language === "bn"
                      ? "রেকর্ড করা হচ্ছে..."
                      : "Marking..."
                    : language === "bn"
                    ? "সব হাজিরা রেকর্ড করুন"
                    : "Mark All Attendance"}
                </button>
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
                    {language === "bn" ? "মোট" : "Total"}
                  </p>
                  <p
                    className={`text-2xl font-bold transition-colors duration-200 ${
                      isDarkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stats.total}
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
                    {language === "bn" ? "উপস্থিত" : "Present"}
                  </p>
                  <p
                    className={`text-2xl font-bold text-green-600 transition-colors duration-200 ${
                      isDarkMode ? "text-green-400" : ""
                    }`}
                  >
                    {stats.present}
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
                    {language === "bn" ? "অনুপস্থিত" : "Absent"}
                  </p>
                  <p
                    className={`text-2xl font-bold text-red-600 transition-colors duration-200 ${
                      isDarkMode ? "text-red-400" : ""
                    }`}
                  >
                    {stats.absent}
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
                    {language === "bn" ? "উপস্থিতি হার" : "Attendance Rate"}
                  </p>
                  <p
                    className={`text-2xl font-bold text-blue-600 transition-colors duration-200 ${
                      isDarkMode ? "text-blue-400" : ""
                    }`}
                  >
                    {stats.presentPercentage}%
                  </p>
                </div>
              </div>
            )}

            {/* Attendance Table */}
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
                        {language === "bn" ? "ক্লাস" : "Class"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "ব্যাচ" : "Batch"}
                      </th>
                      <th
                        className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "হাজিরা" : "Attendance"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAdmissions.map((admission) => {
                      const currentStatus = getAttendanceForStudent(
                        admission._id
                      );
                      const existingAttendance = attendances.find(
                        (att) =>
                          (typeof att.admissionId === "string"
                            ? att.admissionId
                            : att.admissionId._id) === admission._id
                      );

                      return (
                        <tr
                          key={admission._id}
                          className={`transition-colors duration-200 ${
                            isDarkMode
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {admission.studentId || "-"}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {admission.studentName}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {admission.class}
                          </td>
                          <td
                            className={`px-4 py-3 text-sm transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {admission.batchName}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleMarkAttendance(admission._id, "present")
                                }
                                disabled={isPending}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                  currentStatus === "present"
                                    ? "bg-green-600 text-white"
                                    : isDarkMode
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                <FaCheck className="inline mr-1" />
                                {language === "bn" ? "উপস্থিত" : "Present"}
                              </button>
                              <button
                                onClick={() =>
                                  handleMarkAttendance(admission._id, "absent")
                                }
                                disabled={isPending}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                                  currentStatus === "absent"
                                    ? "bg-red-600 text-white"
                                    : isDarkMode
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                <FaTimes className="inline mr-1" />
                                {language === "bn" ? "অনুপস্থিত" : "Absent"}
                              </button>
                              {existingAttendance?.smsSent && (
                                <FaSms
                                  className={`text-green-500 transition-colors duration-200 ${
                                    isDarkMode ? "text-green-400" : ""
                                  }`}
                                  title={
                                    language === "bn"
                                      ? "এসএমএস পাঠানো হয়েছে"
                                      : "SMS sent"
                                  }
                                />
                              )}
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
        ) : (
          /* Report View */
          <div
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="mb-6">
              <h2
                className={`text-xl font-semibold mb-4 transition-colors duration-200 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {language === "bn"
                  ? "সাপ্তাহিক/মাসিক রিপোর্ট"
                  : "Weekly/Monthly Report"}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn"
                      ? "ছাত্র নির্বাচন করুন"
                      : "Select Student"}
                  </label>
                  <select
                    value={selectedStudent || ""}
                    onChange={(e) => {
                      setSelectedStudent(e.target.value || null);
                      if (e.target.value) {
                        handleLoadReport(e.target.value);
                      }
                    }}
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
                        {adm.studentName} ({adm.studentId || "N/A"})
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
                    {language === "bn" ? "সময়কাল" : "Period"}
                  </label>
                  <select
                    value={reportPeriod}
                    onChange={(e) => {
                      setReportPeriod(e.target.value as "week" | "month");
                      if (selectedStudent) {
                        handleLoadReport(selectedStudent);
                      }
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="week">
                      {language === "bn" ? "সাপ্তাহিক" : "Weekly"}
                    </option>
                    <option value="month">
                      {language === "bn" ? "মাসিক" : "Monthly"}
                    </option>
                  </select>
                </div>

                {selectedStudent && reportData && (
                  <div className="flex items-end">
                    <button
                      onClick={() => handleSendReportSMS(selectedStudent)}
                      disabled={isPending}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      <FaSms />
                      {language === "bn" ? "এসএমএস পাঠান" : "Send SMS"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {reportData && (
              <div
                className={`p-6 rounded-lg transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                }`}
              >
                <h3
                  className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {language === "bn" ? "রিপোর্ট বিবরণ" : "Report Details"}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p
                      className={`text-sm mb-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {language === "bn" ? "মোট" : "Total"}
                    </p>
                    <p
                      className={`text-xl font-bold transition-colors duration-200 ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {reportData.total}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm mb-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {language === "bn" ? "উপস্থিত" : "Present"}
                    </p>
                    <p
                      className={`text-xl font-bold text-green-600 transition-colors duration-200 ${
                        isDarkMode ? "text-green-400" : ""
                      }`}
                    >
                      {reportData.present}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm mb-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {language === "bn" ? "অনুপস্থিত" : "Absent"}
                    </p>
                    <p
                      className={`text-xl font-bold text-red-600 transition-colors duration-200 ${
                        isDarkMode ? "text-red-400" : ""
                      }`}
                    >
                      {reportData.absent}
                    </p>
                  </div>
                  <div>
                    <p
                      className={`text-sm mb-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {language === "bn" ? "উপস্থিতি হার" : "Attendance Rate"}
                    </p>
                    <p
                      className={`text-xl font-bold text-blue-600 transition-colors duration-200 ${
                        isDarkMode ? "text-blue-400" : ""
                      }`}
                    >
                      {reportData.presentPercentage}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
