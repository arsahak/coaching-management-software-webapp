"use client";

import { getAdmissions } from "@/app/actions/admission";
import {
  getAttendanceStats,
  getAttendances,
  markAttendance,
  markBatchAttendance,
  sendAttendanceReportSMS,
} from "@/app/actions/attendance";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  FaCalendarAlt,
  FaChartPie,
  FaCheck,
  FaClock,
  FaPaperPlane,
  FaTimes,
  FaUserClock,
} from "react-icons/fa";

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

interface BatchStats {
  batchName: string;
  class: string;
  total: number;
  present: number;
  absent: number;
  notMarked: number;
  presentPercentage: number;
  absentPercentage: number;
}

export default function StudentAttendanceManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // View state: 'dashboard' (overall view) or 'mark' (daily attendance check)
  const [activeTab, setActiveTab] = useState<"dashboard" | "mark">("dashboard");

  // Common State
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    class?: string;
    batch?: string;
    status?: string;
  }>({});

  // Marking State
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, "present" | "absent">
  >({});
  const [selectedAbsentsForSMS, setSelectedAbsentsForSMS] = useState<string[]>(
    [],
  );
  const [selectAllAbsent, setSelectAllAbsent] = useState(false);

  // Batch Stats for Dashboard
  const [batchStats, setBatchStats] = useState<BatchStats[]>([]);

  // Load all unique classes from all admissions
  useEffect(() => {
    const loadAllClasses = async () => {
      startTransition(async () => {
        // Fetch all admissions without filters to get all classes
        const result = await getAdmissions(1, 5000, "", { status: "active" });
        
        if (result.success && result.data) {
          const allAdmissions = (Array.isArray(result.data) ? result.data : []) as Admission[];
          
          // Extract unique classes
          const uniqueClasses = Array.from(
            new Set(allAdmissions.map((adm) => adm.class))
          ).sort((a, b) => {
            // Sort: Class 1, Class 2, ..., Class 12, then custom classes alphabetically
            const classNumA = parseInt(a.replace(/\D/g, ""));
            const classNumB = parseInt(b.replace(/\D/g, ""));
            
            if (!isNaN(classNumA) && !isNaN(classNumB)) {
              return classNumA - classNumB;
            } else if (!isNaN(classNumA)) {
              return -1; // Numbered classes come first
            } else if (!isNaN(classNumB)) {
              return 1;
            } else {
              return a.localeCompare(b); // Custom classes alphabetically
            }
          });
          
          setAvailableClasses(uniqueClasses);
        }
      });
    };
    
    loadAllClasses();
  }, []); // Load once on mount

  // Load Initial Data
  useEffect(() => {
    // When tab changes or filters change, reload relevant data
    loadAdmissions();
    if (activeTab === "mark") {
      loadAttendance();
    } else if (activeTab === "dashboard") {
      loadAttendance();
      loadStats();
    }
  }, [activeTab, filters, search, selectedDate]);

  // Calculate batch stats when data changes
  useEffect(() => {
    if (activeTab === "dashboard" && admissions.length > 0) {
      calculateBatchStats();
    }
  }, [activeTab, admissions, attendanceMap, filters]);

  const loadAdmissions = async () => {
    startTransition(async () => {
      // Fetch all active students matching filters
      const result = await getAdmissions(1, 1000, search, {
        class: filters.class,
        batch: filters.batch,
        status: filters.status || "active",
      });

      if (result.success && result.data) {
        setAdmissions(
          (Array.isArray(result.data) ? result.data : []) as Admission[],
        );
      }
    });
  };

  const loadAttendance = async () => {
    startTransition(async () => {
      const result = await getAttendances(1, 1000, {
        startDate: selectedDate,
        endDate: selectedDate,
        class: filters.class,
        batchName: filters.batch,
      });

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setAttendances(data as Attendance[]);

        // Update map for quick lookup
        const map: Record<string, "present" | "absent"> = {};
        data.forEach((att: Attendance) => {
          const admissionId =
            typeof att.admissionId === "string"
              ? att.admissionId
              : (att.admissionId as Admission)._id;
          map[admissionId] = att.status;
        });
        setAttendanceMap(map);
      }
    });
  };

  const loadStats = async () => {
    startTransition(async () => {
      const result = await getAttendanceStats({
        startDate: selectedDate,
        endDate: selectedDate,
        class: filters.class, // Respect filters if applied on dashboard too
        batchName: filters.batch,
      });

      if (result.success && result.data) {
        setStats(result.data as AttendanceStats);
      }
    });
  };

  const calculateBatchStats = () => {
    // Group students by batch
    const batchMap = new Map<
      string,
      {
        class: string;
        students: Admission[];
      }
    >();

    filteredAdmissions.forEach((adm) => {
      const key = `${adm.class}|||${adm.batchName}`;
      if (!batchMap.has(key)) {
        batchMap.set(key, {
          class: adm.class,
          students: [],
        });
      }
      batchMap.get(key)!.students.push(adm);
    });

    // Calculate stats for each batch
    const stats: BatchStats[] = [];
    batchMap.forEach((value, key) => {
      const [className, batchName] = key.split("|||");
      const total = value.students.length;
      const present = value.students.filter(
        (s) => attendanceMap[s._id] === "present"
      ).length;
      const absent = value.students.filter(
        (s) => attendanceMap[s._id] === "absent"
      ).length;
      const notMarked = total - present - absent;

      stats.push({
        batchName: batchName,
        class: className,
        total,
        present,
        absent,
        notMarked,
        presentPercentage: total > 0 ? (present / total) * 100 : 0,
        absentPercentage: total > 0 ? (absent / total) * 100 : 0,
      });
    });

    // Sort by class and batch name
    stats.sort((a, b) => {
      if (a.class !== b.class) {
        return a.class.localeCompare(b.class);
      }
      return a.batchName.localeCompare(b.batchName);
    });

    setBatchStats(stats);
  };

  const handleMarkAttendance = async (
    admissionId: string,
    status: "present" | "absent",
  ) => {
    const previousStatus = attendanceMap[admissionId];
    setAttendanceMap((prev) => ({ ...prev, [admissionId]: status }));

    if (status === "present") {
      setSelectedAbsentsForSMS((prev) =>
        prev.filter((id) => id !== admissionId),
      );
    }

    startTransition(async () => {
      const result = await markAttendance({
        admissionId,
        date: selectedDate,
        status,
      });
      if (result.success) {
        toast.success(getTranslation("sconstendance", language) || "Marked");
        loadAttendance(); // Refresh to update dashboard list if needed
        loadStats();
      } else {
        toast.error("Failed");
        setAttendanceMap((prev) => ({
          ...prev,
          [admissionId]: previousStatus,
        }));
      }
    });
  };

  const handleBatchMarkPresent = async () => {
    // Only mark filtered visible students
    const updates = filteredAdmissions.map((adm) => ({
      admissionId: adm._id,
      status: "present" as "present",
    }));

    if (updates.length === 0) return;

    startTransition(async () => {
      const result = await markBatchAttendance(selectedDate, updates);
      if (result.success) {
        toast.success("All marked present");
        loadAttendance();
        loadStats();
      } else {
        toast.error("Error marking batch");
      }
    });
  };

  const handleSendAbsentSMS = async () => {
    if (selectedAbsentsForSMS.length === 0) return;

    startTransition(async () => {
      let count = 0;
      // Mock sending
      for (const id of selectedAbsentsForSMS) {
        const res = await sendAttendanceReportSMS(id, selectedDate, "week"); // Using generic for now
        if (res.success) count++;
      }
      toast.success(`${count} SMS sent`);
      setSelectedAbsentsForSMS([]);
      setSelectAllAbsent(false);
    });
  };

  const handleToggleSelectAllAbsent = () => {
    if (selectAllAbsent) {
      setSelectedAbsentsForSMS([]);
    } else {
      // Select all students who are marked as 'absent' in the current filtered view
      const absentStudentIds = filteredAdmissions
        .filter((adm) => attendanceMap[adm._id] === "absent")
        .map((adm) => adm._id);
      setSelectedAbsentsForSMS(absentStudentIds);
    }
    setSelectAllAbsent(!selectAllAbsent);
  };

  // Filter Logic - For Mark tab, only show students when class OR batch is selected
  const filteredAdmissions = admissions.filter((adm) => {
    // Apply class filter
    if (filters.class && adm.class !== filters.class) {
      return false;
    }
    // Apply batch filter
    if (filters.batch && !adm.batchName.toLowerCase().includes(filters.batch.toLowerCase())) {
      return false;
    }
    // Apply search filter
    if (search) {
      const q = search.toLowerCase();
      return (
        adm.studentName.toLowerCase().includes(q) ||
        (adm.studentId || "").toLowerCase().includes(q) ||
        adm.class.toLowerCase().includes(q) ||
        adm.batchName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Check if filters are selected for Mark tab
  const hasFiltersSelected = filters.class || filters.batch;

  // Dashboard Logic: Merging Admissions + Attendance status
  // We want to show ALL students (admission list) and their status for specific date
  // So we use filteredAdmissions as base (if loaded) or we rely on 'attendances' for summary?
  // The request says "show all student which one attend which one absent".
  // Best way: Use 'admissions' list and map status, similar to marking but read-only focused.

  // To ensure dashboard has data, we need permissions to load 'admissions' on dashboard tab too.
  useEffect(() => {
    if (activeTab === "dashboard") {
      loadAdmissions();
    }
  }, [activeTab]);

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "bg-gray-900" : "bg-gray-50 bg-gray-50"}`}
    >
      <div className="p-4 md:p-6 w-full mx-auto">
        {/* Header & Global Date Filter */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1
              className={`text-2xl md:text-3xl font-bold flex items-center gap-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                <FaUserClock className="text-xl text-white" />
              </div>
              {language === "bn" ? "হাজিরা পর্যবেক্ষণ" : "Attendance Overview"}
            </h1>
            <p
              className={`text-sm mt-2 ml-1 ${isDarkMode ? "text-gray-300" : "text-gray-500"}`}
            >
              {new Date(selectedDate).toLocaleDateString(
                language === "bn" ? "bn-BD" : "en-US",
                {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </p>
          </div>

          {/* Date Picker */}
          <div className="relative group">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all cursor-pointer shadow-lg ${
                isDarkMode 
                  ? "bg-gray-800 text-white border-2 border-gray-700 hover:border-blue-500 focus:border-blue-500" 
                  : "bg-white text-gray-900 border-2 border-gray-200 hover:border-blue-400 focus:border-blue-400"
              }`}
            />
            <FaCalendarAlt className={`absolute left-3.5 top-3.5 text-sm transition-colors ${
              isDarkMode ? "text-gray-400 group-hover:text-blue-400" : "text-gray-400 group-hover:text-blue-500"
            }`} />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-3 px-1 text-sm font-medium transition-all relative ${
              activeTab === "dashboard"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {language === "bn" ? "ড্যাশবোর্ড ও রিপোর্ট" : "Dashboard & Report"}
            {activeTab === "dashboard" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("mark")}
            className={`pb-3 px-1 text-sm font-medium transition-all relative ${
              activeTab === "mark"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {language === "bn"
              ? "হাজিরা খাতা (ব্যাচ/ক্লাস)"
              : "Check Daily Attendance"}
            {activeTab === "mark" && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full"></div>
            )}
          </button>
        </div>

        {/* TAB 1: DASHBOARD - Batch-wise Report */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Overall Stats Cards - Simplified Design */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Card */}
                <div className={`rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-md ${
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 hover:border-gray-600" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-blue-900/30" : "bg-blue-50"}`}>
                      <FaChartPie className={`text-lg ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
                    </div>
                    <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {stats.total}
                    </div>
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {language === "bn" ? "মোট ছাত্র" : "Total Students"}
                  </p>
                </div>

                {/* Present Card */}
                <div className={`rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-md ${
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 hover:border-gray-600" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-green-900/30" : "bg-green-50"}`}>
                      <FaCheck className={`text-lg ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {stats.present}
                      </div>
                      <div className={`text-sm font-semibold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                        {stats.presentPercentage}%
                      </div>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {language === "bn" ? "উপস্থিত" : "Present Today"}
                  </p>
                </div>

                {/* Absent Card */}
                <div className={`rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-md ${
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 hover:border-gray-600" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-red-900/30" : "bg-red-50"}`}>
                      <FaTimes className={`text-lg ${isDarkMode ? "text-red-400" : "text-red-600"}`} />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {stats.absent}
                      </div>
                      <div className={`text-sm font-semibold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                        {stats.absentPercentage}%
                      </div>
                    </div>
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {language === "bn" ? "অনুপস্থিত" : "Absent Today"}
                  </p>
                </div>

                {/* Batches Card */}
                <div className={`rounded-xl p-5 border-2 transition-all duration-300 hover:shadow-md ${
                  isDarkMode 
                    ? "bg-gray-800 border-gray-700 hover:border-gray-600" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2.5 rounded-lg ${isDarkMode ? "bg-purple-900/30" : "bg-purple-50"}`}>
                      <FaUserClock className={`text-lg ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
                    </div>
                    <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {batchStats.length}
                    </div>
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}>
                    {language === "bn" ? "মোট ব্যাচ" : "Total Batches"}
                  </p>
                </div>
              </div>
            )}

            {/* Filters - Simplified */}
            <div className={`flex flex-col md:flex-row gap-3 p-4 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
              <select
                className={`px-4 py-2.5 rounded-lg border text-sm outline-none transition-all ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white hover:border-gray-500 focus:border-blue-500"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:border-gray-400 focus:border-blue-500"
                }`}
                value={filters.class || ""}
                onChange={(e) =>
                  setFilters({ ...filters, class: e.target.value || undefined })
                }
              >
                <option value="">
                  {language === "bn" ? "সব ক্লাস" : "All Classes"}
                </option>
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    {className}
                  </option>
                ))}
              </select>
              <input
                placeholder={
                  language === "bn" ? "ব্যাচ খুঁজুন..." : "Search batch..."
                }
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm outline-none transition-all ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-gray-500 focus:border-blue-500"
                    : "bg-gray-50 border-gray-300 text-gray-700 placeholder-gray-400 hover:border-gray-400 focus:border-blue-500"
                }`}
                value={filters.batch || ""}
                onChange={(e) =>
                  setFilters({ ...filters, batch: e.target.value || undefined })
                }
              />
            </div>

            {/* Batch Report Title */}
            <div className="space-y-4">
              <h3
                className={`text-lg font-bold flex items-center gap-2 ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                <FaUserClock className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
                {language === "bn" ? "ব্যাচওয়ারি হাজিরা রিপোর্ট" : "Batch-wise Attendance Report"}
              </h3>

              {batchStats.length > 0 ? (
                <div className={`rounded-lg border overflow-hidden ${
                  isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                }`}>
                  <table className="w-full text-sm">
                    <thead className={isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}>
                      <tr>
                        <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {language === "bn" ? "ব্যাচ নাম" : "Batch Name"}
                        </th>
                        <th className={`px-4 py-3 text-left font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {language === "bn" ? "ক্লাস" : "Class"}
                        </th>
                        <th className={`px-4 py-3 text-center font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {language === "bn" ? "মোট" : "Total"}
                        </th>
                        <th className={`px-4 py-3 text-center font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {language === "bn" ? "উপস্থিত" : "Present"}
                        </th>
                        <th className={`px-4 py-3 text-center font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {language === "bn" ? "অনুপস্থিত" : "Absent"}
                        </th>
                        <th className={`px-4 py-3 text-center font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {language === "bn" ? "বাকি" : "Pending"}
                        </th>
                        <th className={`px-4 py-3 text-center font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {language === "bn" ? "উপস্থিতি %" : "Attendance %"}
                        </th>
                        <th className={`px-4 py-3 text-center font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {language === "bn" ? "স্ট্যাটাস" : "Status"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                      {batchStats.map((batch, index) => (
                        <tr
                          key={index}
                          className={isDarkMode ? "hover:bg-gray-700/30" : "hover:bg-gray-50"}
                        >
                          {/* Batch Name */}
                          <td className="px-4 py-3">
                            <div className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                              {batch.batchName}
                            </div>
                          </td>

                          {/* Class */}
                          <td className={`px-4 py-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                            {batch.class}
                          </td>

                          {/* Total */}
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                              {batch.total}
                            </span>
                          </td>

                          {/* Present */}
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${isDarkMode ? "text-green-400" : "text-green-600"}`}>
                              {batch.present}
                            </span>
                          </td>

                          {/* Absent */}
                          <td className="px-4 py-3 text-center">
                            <span className={`font-semibold ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
                              {batch.absent}
                            </span>
                          </td>

                          {/* Pending */}
                          <td className="px-4 py-3 text-center">
                            {batch.notMarked > 0 ? (
                              <span className={`font-semibold ${isDarkMode ? "text-orange-400" : "text-orange-600"}`}>
                                {batch.notMarked}
                              </span>
                            ) : (
                              <span className={isDarkMode ? "text-gray-600" : "text-gray-400"}>-</span>
                            )}
                          </td>

                          {/* Attendance Percentage */}
                          <td className="px-4 py-3">
                            <div className="flex flex-col items-center gap-1.5">
                              <span className={`text-base font-bold ${
                                batch.presentPercentage >= 80
                                  ? isDarkMode ? "text-green-400" : "text-green-600"
                                  : batch.presentPercentage >= 60
                                  ? isDarkMode ? "text-yellow-400" : "text-yellow-600"
                                  : isDarkMode ? "text-red-400" : "text-red-600"
                              }`}>
                                {batch.presentPercentage.toFixed(0)}%
                              </span>
                              <div className={`w-20 h-1.5 rounded-full overflow-hidden ${
                                isDarkMode ? "bg-gray-700" : "bg-gray-200"
                              }`}>
                                <div
                                  className={`h-full ${
                                    batch.presentPercentage >= 80
                                      ? "bg-green-500"
                                      : batch.presentPercentage >= 60
                                      ? "bg-yellow-500"
                                      : "bg-red-500"
                                  }`}
                                  style={{ width: `${batch.presentPercentage}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3 text-center">
                            {batch.presentPercentage >= 80 ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                                isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700"
                              }`}>
                                <FaCheck className="text-[10px]" />
                                {language === "bn" ? "চমৎকার" : "Excellent"}
                              </span>
                            ) : batch.presentPercentage >= 60 ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                                isDarkMode ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-700"
                              }`}>
                                <FaClock className="text-[10px]" />
                                {language === "bn" ? "ভালো" : "Good"}
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                                isDarkMode ? "bg-red-900/30 text-red-400" : "bg-red-100 text-red-700"
                              }`}>
                                <FaTimes className="text-[10px]" />
                                {language === "bn" ? "মনোযোগ দিন" : "Attention"}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  className={`p-12 text-center rounded-xl border ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-gray-50 border-gray-200"
                  }`}
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    isDarkMode ? "bg-gray-700" : "bg-gray-200"
                  }`}>
                    <FaUserClock className={`text-2xl ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                  </div>
                  <p
                    className={`text-base font-semibold mb-2 ${
                      isDarkMode ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {language === "bn"
                      ? "কোন ব্যাচ পাওয়া যায়নি"
                      : "No Batches Found"}
                  </p>
                  <p
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {language === "bn"
                      ? "ক্লাস বা ব্যাচ ফিল্টার পরিবর্তন করুন"
                      : "Try changing class or batch filter"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MARK ATTENDANCE BOOK */}
        {activeTab === "mark" && (
          <div className="space-y-6">
            {/* Advanced Filters Card */}
            <div
              className={`p-4 rounded-xl border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200 shadow-sm"}`}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">
                    Class
                  </label>
                  <select
                    className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"}`}
                    value={filters.class || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        class: e.target.value || undefined,
                      })
                    }
                  >
                    <option value="">{language === "bn" ? "ক্লাস নির্বাচন করুন" : "Select Class"}</option>
                    {availableClasses.map((className) => (
                      <option key={className} value={className}>
                        {className}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-gray-500 mb-1 block">
                    Batch
                  </label>
                  <input
                    className={`w-full p-2 rounded-lg border text-sm outline-none ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-300"}`}
                    placeholder="Enter Batch Name"
                    value={filters.batch || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        batch: e.target.value || undefined,
                      })
                    }
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleBatchMarkPresent}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Mark All Visible Present
                  </button>
                </div>
              </div>
            </div>

            {/* Bulk SMS Action */}
            {selectedAbsentsForSMS.length > 0 && (
              <div
                className={`p-3 rounded-lg flex justify-between items-center ${isDarkMode ? "bg-blue-900/30 text-blue-200 border border-blue-800" : "bg-blue-50 text-blue-800 border border-blue-200"}`}
              >
                <span className="text-sm font-medium">
                  {selectedAbsentsForSMS.length} Absentees Selected
                </span>
                <button
                  onClick={handleSendAbsentSMS}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center gap-2"
                >
                  <FaPaperPlane /> Send SMS
                </button>
              </div>
            )}

            {/* Student List - Show only when filters are selected */}
            {!hasFiltersSelected ? (
              <div
                className={`p-20 text-center rounded-2xl border-2 border-dashed ${
                  isDarkMode
                    ? "bg-gray-800/30 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-6">
                  <FaUserClock className="text-4xl text-white" />
                </div>
                <p
                  className={`text-xl font-bold mb-3 ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {language === "bn"
                    ? "ক্লাস বা ব্যাচ নির্বাচন করুন"
                    : "Select Class or Batch"}
                </p>
                <p
                  className={`text-sm max-w-md mx-auto ${
                    isDarkMode ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  {language === "bn"
                    ? "হাজিরা চেক করার জন্য উপরে থেকে একটি ক্লাস অথবা ব্যাচ সিলেক্ট করুন"
                    : "Please select a class or batch from the filters above to check attendance"}
                </p>
              </div>
            ) : filteredAdmissions.length === 0 ? (
              <div
                className={`p-16 text-center rounded-2xl border-2 border-dashed ${
                  isDarkMode
                    ? "bg-gray-800/30 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 mb-4">
                  <FaUserClock className="text-3xl text-white" />
                </div>
                <p
                  className={`text-lg font-semibold mb-2 ${
                    isDarkMode ? "text-white" : "text-gray-600"
                  }`}
                >
                  {language === "bn"
                    ? "কোন ছাত্র পাওয়া যায়নি"
                    : "No Students Found"}
                </p>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-300" : "text-gray-400"
                  }`}
                >
                  {language === "bn"
                    ? "নির্বাচিত ক্লাস বা ব্যাচে কোন ছাত্র নেই"
                    : "No students found for the selected class or batch"}
                </p>
              </div>
            ) : (
              <div
                className={`rounded-xl border shadow-sm overflow-hidden ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <table className="w-full text-sm">
                  <thead
                    className={`text-xs uppercase ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50 text-gray-500"}`}
                  >
                    <tr>
                      <th className="px-4 py-3 text-center w-10">
                        <input
                          type="checkbox"
                          onChange={handleToggleSelectAllAbsent}
                          checked={selectAllAbsent}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left">Student Info</th>
                      <th className="px-4 py-3 text-center">Attendance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {filteredAdmissions.map((adm) => {
                      const status = attendanceMap[adm._id];
                      return (
                        <tr
                          key={adm._id}
                          className={
                            isDarkMode
                              ? "hover:bg-gray-700/50"
                              : "hover:bg-gray-50"
                          }
                        >
                          <td className="px-4 py-3 text-center">
                            {status === "absent" && (
                              <input
                                type="checkbox"
                                checked={selectedAbsentsForSMS.includes(adm._id)}
                                onChange={() => {
                                  setSelectedAbsentsForSMS((prev) =>
                                    prev.includes(adm._id)
                                      ? prev.filter((id) => id !== adm._id)
                                      : [...prev, adm._id],
                                  );
                                }}
                              />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{adm.studentName}</div>
                            <div className="text-xs text-gray-500">
                              {adm.class} | {adm.batchName}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() =>
                                  handleMarkAttendance(adm._id, "present")
                                }
                                className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                                  status === "present"
                                    ? "bg-green-600 text-white border-green-600"
                                    : isDarkMode
                                      ? "bg-gray-700 text-gray-400 border-gray-600"
                                      : "bg-white text-gray-500 border-gray-200"
                                }`}
                              >
                                P
                              </button>
                              <button
                                onClick={() =>
                                  handleMarkAttendance(adm._id, "absent")
                                }
                                className={`px-3 py-1.5 rounded text-xs font-bold border transition-all ${
                                  status === "absent"
                                    ? "bg-red-600 text-white border-red-600"
                                    : isDarkMode
                                      ? "bg-gray-700 text-gray-400 border-gray-600"
                                      : "bg-white text-gray-500 border-gray-200"
                                }`}
                              >
                                A
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
