"use client";

import { getAdmissions } from "@/app/actions/admission";
import {
  createBatchExamResults,
  createExam,
  deleteExam,
  getExamResults,
  getExamStats,
  getExams,
  sendExamResultSMS,
  sendExamScheduleSMS,
  updateExam,
} from "@/app/actions/exam";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  FaArrowLeft,
  FaChartBar,
  FaCheck,
  FaEdit,
  FaFilter,
  FaPlus,
  FaSearch,
  FaSms,
  FaTimes,
  FaTrash,
} from "react-icons/fa";

interface Exam {
  _id: string;
  examName: string;
  examType: "quiz" | "midterm" | "final" | "assignment" | "other";
  subject: string;
  class: string;
  batchName?: string;
  description?: string;
  examDate: string;
  examTime: string;
  duration?: number;
  status: "scheduled" | "completed" | "cancelled";
  scheduleSmsSent: boolean;
  resultSmsSent: boolean;
}

interface ExamResult {
  _id: string;
  examId: string | Exam;
  admissionId: string | any;
  studentId?: string;
  studentName: string;
  marks: number;
  totalMarks: number;
  grade?: string;
  percentage: number;
  present: boolean;
  absentSmsSent: boolean;
  resultSmsSent: boolean;
}

interface Admission {
  _id: string;
  studentName: string;
  studentId?: string;
  class: string;
  batchName: string;
}

const inputClass = (isDarkMode: boolean) =>
  `w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
    isDarkMode
      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
      : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
  }`;

export default function ExamManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "create" | "edit" | "results">("list");
  const [results, setResults] = useState<ExamResult[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    class?: string;
    subject?: string;
    examType?: string;
    status?: string;
  }>({});

  const [examForm, setExamForm] = useState<{
    examName: string;
    examType: "quiz" | "midterm" | "final" | "assignment" | "other";
    subject: string;
    class: string;
    batchName: string;
    description: string;
    examDate: string;
    examTime: string;
    duration: string;
  }>({
    examName: "",
    examType: "quiz",
    subject: "",
    class: "",
    batchName: "",
    description: "",
    examDate: new Date().toISOString().split("T")[0],
    examTime: "",
    duration: "",
  });

  const [resultForm, setResultForm] = useState<
    Record<string, { marks: string; totalMarks: string; grade: string; present: boolean }>
  >({});

  useEffect(() => { loadExams(); }, [filters, search]);

  useEffect(() => {
    if (selectedExam && viewMode === "results") {
      loadResults();
      loadStats();
      loadAdmissions();
    }
  }, [selectedExam, viewMode]);

  const loadExams = async () => {
    startTransition(async () => {
      const result = await getExams(1, 100, filters);
      if (result.success && result.data) {
        setExams((Array.isArray(result.data) ? result.data : []) as Exam[]);
      }
    });
  };

  const loadResults = async () => {
    if (!selectedExam) return;
    startTransition(async () => {
      const result = await getExamResults(selectedExam._id);
      if (result.success && result.data) {
        const data = (Array.isArray(result.data) ? result.data : []) as ExamResult[];
        setResults(data);
        const form: Record<string, any> = {};
        data.forEach((res) => {
          const admissionId = typeof res.admissionId === "string" ? res.admissionId : res.admissionId._id;
          form[admissionId] = { marks: res.marks.toString(), totalMarks: res.totalMarks.toString(), grade: res.grade || "", present: res.present };
        });
        setResultForm(form);
      }
    });
  };

  const loadAdmissions = async () => {
    if (!selectedExam) return;
    startTransition(async () => {
      const result = await getAdmissions(1, 1000, "", { class: selectedExam.class, batch: selectedExam.batchName, status: "active" });
      if (result.success && result.data) {
        const data = (Array.isArray(result.data) ? result.data : []) as Admission[];
        setAdmissions(data);
        const form = { ...resultForm };
        data.forEach((adm) => {
          if (!form[adm._id]) form[adm._id] = { marks: "", totalMarks: "", grade: "", present: true };
        });
        setResultForm(form);
      }
    });
  };

  const loadStats = async () => {
    if (!selectedExam) return;
    startTransition(async () => {
      const result = await getExamStats(selectedExam._id);
      if (result.success && result.data) setStats(result.data);
    });
  };

  const resetForm = () => ({
    examName: "", examType: "quiz" as const, subject: "", class: "", batchName: "",
    description: "", examDate: new Date().toISOString().split("T")[0], examTime: "", duration: "",
  });

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await createExam({ ...examForm, duration: examForm.duration ? parseInt(examForm.duration) : undefined });
      if (result.success) {
        toast.success(language === "bn" ? "পরীক্ষা সফলভাবে তৈরি করা হয়েছে" : "Exam created successfully");
        setViewMode("list"); setExamForm(resetForm()); loadExams();
      } else {
        toast.error(result.error || (language === "bn" ? "পরীক্ষা তৈরি করতে ব্যর্থ" : "Failed to create exam"));
      }
    });
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;
    startTransition(async () => {
      const result = await updateExam(selectedExam._id, { ...examForm, duration: examForm.duration ? parseInt(examForm.duration) : undefined });
      if (result.success) {
        toast.success(language === "bn" ? "পরীক্ষা সফলভাবে আপডেট করা হয়েছে" : "Exam updated successfully");
        setViewMode("list"); setSelectedExam(null); loadExams();
      } else {
        toast.error(result.error || (language === "bn" ? "পরীক্ষা আপডেট করতে ব্যর্থ" : "Failed to update exam"));
      }
    });
  };

  const handleDeleteExam = async (id: string) => {
    if (!confirm(language === "bn" ? "আপনি কি এই পরীক্ষা মুছে ফেলতে চান?" : "Are you sure you want to delete this exam?")) return;
    startTransition(async () => {
      const result = await deleteExam(id);
      if (result.success) {
        toast.success(language === "bn" ? "পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে" : "Exam deleted successfully");
        loadExams();
      } else {
        toast.error(result.error || (language === "bn" ? "পরীক্ষা মুছতে ব্যর্থ" : "Failed to delete exam"));
      }
    });
  };

  const handleSendScheduleSMS = async (examId: string) => {
    startTransition(async () => {
      const result = await sendExamScheduleSMS(examId);
      if (result.success) {
        toast.success(language === "bn" ? "পরীক্ষার সময়সূচী এসএমএস সফলভাবে পাঠানো হয়েছে" : "Schedule SMS sent successfully");
        loadExams();
      } else {
        toast.error(result.error || (language === "bn" ? "এসএমএস পাঠাতে ব্যর্থ" : "Failed to send SMS"));
      }
    });
  };

  const handleSaveResults = async () => {
    if (!selectedExam) return;
    const resultsToSave = admissions
      .filter((adm) => { const f = resultForm[adm._id]; return f && f.marks && f.totalMarks; })
      .map((adm) => { const f = resultForm[adm._id]; return { admissionId: adm._id, marks: parseFloat(f.marks), totalMarks: parseFloat(f.totalMarks), grade: f.grade || undefined, present: f.present }; });
    if (resultsToSave.length === 0) { toast.error(language === "bn" ? "কোন ফলাফল নেই" : "No results to save"); return; }
    startTransition(async () => {
      const result = await createBatchExamResults(selectedExam._id, resultsToSave);
      if (result.success) {
        toast.success(language === "bn" ? `${resultsToSave.length} জন ছাত্রের ফলাফল সংরক্ষণ হয়েছে` : `Results saved for ${resultsToSave.length} student(s)`);
        loadResults(); loadStats();
      } else {
        toast.error(result.error || (language === "bn" ? "ফলাফল সংরক্ষণ করতে ব্যর্থ" : "Failed to save results"));
      }
    });
  };

  const handleSendResultSMS = async () => {
    if (!selectedExam) return;
    startTransition(async () => {
      const result = await sendExamResultSMS(selectedExam._id);
      if (result.success) {
        toast.success(language === "bn" ? "ফলাফল এসএমএস সফলভাবে পাঠানো হয়েছে" : "Result SMS sent successfully");
        loadResults(); loadExams();
      } else {
        toast.error(result.error || (language === "bn" ? "এসএমএস পাঠাতে ব্যর্থ" : "Failed to send SMS"));
      }
    });
  };

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setExamForm({
      examName: exam.examName, examType: exam.examType, subject: exam.subject, class: exam.class,
      batchName: exam.batchName || "", description: exam.description || "",
      examDate: new Date(exam.examDate).toISOString().split("T")[0],
      examTime: exam.examTime, duration: exam.duration?.toString() || "",
    });
    setViewMode("edit");
  };

  const handleViewResults = (exam: Exam) => { setSelectedExam(exam); setViewMode("results"); };

  const filteredExams = exams.filter((exam) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return exam.examName.toLowerCase().includes(q) || exam.subject.toLowerCase().includes(q) || exam.class.toLowerCase().includes(q);
  });

  const statusBadge = (status: Exam["status"]) => {
    if (status === "completed") return isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-800";
    if (status === "scheduled") return isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800";
    return isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600";
  };

  const statusLabel = (status: Exam["status"]) => {
    const map = { completed: language === "bn" ? "সম্পন্ন" : "Completed", scheduled: language === "bn" ? "নির্ধারিত" : "Scheduled", cancelled: language === "bn" ? "বাতিল" : "Cancelled" };
    return map[status];
  };

  const examTypeLabel = (type: Exam["examType"]) => {
    const map = { quiz: language === "bn" ? "কুইজ" : "Quiz", midterm: language === "bn" ? "মিডটার্ম" : "Midterm", final: language === "bn" ? "ফাইনাল" : "Final", assignment: language === "bn" ? "অ্যাসাইনমেন্ট" : "Assignment", other: language === "bn" ? "অন্যান্য" : "Other" };
    return map[type];
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="p-6">

        {/* ── LIST VIEW ─────────────────────────────────────────── */}
        {viewMode === "list" && (
          <>
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
              <div>
                <h1 className={`text-3xl font-bold transition-colors duration-200 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {language === "bn" ? "পরীক্ষা ব্যবস্থাপনা" : "Exam Management"}
                </h1>
                <p className={`text-sm mt-1 transition-colors duration-200 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {language === "bn" ? "পরীক্ষার সময়সূচী, ফলাফল এবং এসএমএস ব্যবস্থাপনা" : "Manage exam schedules, results and SMS notifications"}
                </p>
              </div>
              <div className="mt-4 lg:mt-0">
                <button
                  onClick={() => { setSelectedExam(null); setExamForm(resetForm()); setViewMode("create"); }}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <FaPlus className="text-sm" />
                  {language === "bn" ? "নতুন পরীক্ষা" : "New Exam"}
                </button>
              </div>
            </div>

            {/* Search & Filter Card */}
            <div className={`p-6 rounded-xl shadow-md mb-8 transition-colors duration-200 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="flex items-center gap-2 mb-4">
                <FaFilter className={`transition-colors duration-200 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
                <h2 className={`text-lg font-semibold transition-colors duration-200 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {language === "bn" ? "অনুসন্ধান ও ফিল্টার" : "Search & Filter"}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-200 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={language === "bn" ? "পরীক্ষার নাম, বিষয়..." : "Search exam, subject..."}
                    className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-500" : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"}`}
                  />
                </div>

                {/* Class Filter */}
                <select
                  value={filters.class || ""}
                  onChange={(e) => setFilters({ ...filters, class: e.target.value || undefined })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                >
                  <option value="">{language === "bn" ? "সব ক্লাস" : "All Classes"}</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={`Class ${i + 1}`}>{language === "bn" ? "ক্লাস" : "Class"} {i + 1}</option>
                  ))}
                </select>

                {/* Exam Type Filter */}
                <select
                  value={filters.examType || ""}
                  onChange={(e) => setFilters({ ...filters, examType: e.target.value || undefined })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                >
                  <option value="">{language === "bn" ? "সব ধরন" : "All Types"}</option>
                  <option value="quiz">{language === "bn" ? "কুইজ" : "Quiz"}</option>
                  <option value="midterm">{language === "bn" ? "মিডটার্ম" : "Midterm"}</option>
                  <option value="final">{language === "bn" ? "ফাইনাল" : "Final"}</option>
                  <option value="assignment">{language === "bn" ? "অ্যাসাইনমেন্ট" : "Assignment"}</option>
                  <option value="other">{language === "bn" ? "অন্যান্য" : "Other"}</option>
                </select>

                {/* Status Filter */}
                <select
                  value={filters.status || ""}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                >
                  <option value="">{language === "bn" ? "সব স্ট্যাটাস" : "All Status"}</option>
                  <option value="scheduled">{language === "bn" ? "নির্ধারিত" : "Scheduled"}</option>
                  <option value="completed">{language === "bn" ? "সম্পন্ন" : "Completed"}</option>
                  <option value="cancelled">{language === "bn" ? "বাতিল" : "Cancelled"}</option>
                </select>
              </div>
            </div>

            {/* Exams Table */}
            <div className={`rounded-xl shadow-md overflow-hidden transition-colors duration-200 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`transition-colors duration-200 ${isDarkMode ? "bg-gradient-to-r from-gray-700 to-gray-800" : "bg-gradient-to-r from-gray-50 to-gray-100"}`}>
                    <tr>
                      {[
                        language === "bn" ? "পরীক্ষার নাম" : "Exam Name",
                        language === "bn" ? "বিষয়" : "Subject",
                        language === "bn" ? "ক্লাস / ব্যাচ" : "Class / Batch",
                        language === "bn" ? "ধরন" : "Type",
                        language === "bn" ? "তারিখ ও সময়" : "Date & Time",
                        language === "bn" ? "স্ট্যাটাস" : "Status",
                      ].map((h) => (
                        <th key={h} className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{h}</th>
                      ))}
                      <th className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                        {language === "bn" ? "কর্ম" : "Actions"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-200 ${isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}`}>
                    {filteredExams.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                              <FaSearch className={`text-xl ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
                            </div>
                            <p className={`text-lg font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                              {language === "bn" ? "কোন পরীক্ষা পাওয়া যায়নি" : "No exams found"}
                            </p>
                            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {language === "bn" ? "ফিল্টার পরিবর্তন করুন বা নতুন পরীক্ষা যোগ করুন" : "Try adjusting filters or add a new exam"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredExams.map((exam) => (
                        <tr key={exam._id} className={`transition-colors duration-150 ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold transition-colors duration-200 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                              {exam.examName}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {exam.subject}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {exam.class}
                            </span>
                            {exam.batchName && (
                              <span className={`block text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {exam.batchName}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
                              {examTypeLabel(exam.examType)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                              {new Date(exam.examDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                            </span>
                            <span className={`block text-xs mt-0.5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                              {exam.examTime}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${statusBadge(exam.status)}`}>
                              {statusLabel(exam.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewResults(exam)}
                                className={`p-2 rounded-lg transition-colors duration-150 ${isDarkMode ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20" : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"}`}
                                title={language === "bn" ? "ফলাফল" : "Results"}
                              >
                                <FaChartBar className="text-base" />
                              </button>
                              <button
                                onClick={() => handleEdit(exam)}
                                className={`p-2 rounded-lg transition-colors duration-150 ${isDarkMode ? "text-green-400 hover:text-green-300 hover:bg-green-900/20" : "text-green-600 hover:text-green-700 hover:bg-green-50"}`}
                                title={language === "bn" ? "সম্পাদনা" : "Edit"}
                              >
                                <FaEdit className="text-base" />
                              </button>
                              {!exam.scheduleSmsSent && (
                                <button
                                  onClick={() => handleSendScheduleSMS(exam._id)}
                                  disabled={isPending}
                                  className={`p-2 rounded-lg transition-colors duration-150 disabled:opacity-50 ${isDarkMode ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20" : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"}`}
                                  title={language === "bn" ? "সময়সূচী SMS" : "Schedule SMS"}
                                >
                                  <FaSms className="text-base" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteExam(exam._id)}
                                disabled={isPending}
                                className={`p-2 rounded-lg transition-colors duration-150 disabled:opacity-50 ${isDarkMode ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : "text-red-600 hover:text-red-700 hover:bg-red-50"}`}
                                title={language === "bn" ? "মুছুন" : "Delete"}
                              >
                                <FaTrash className="text-base" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── CREATE / EDIT FORM ────────────────────────────────── */}
        {(viewMode === "create" || viewMode === "edit") && (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => { setViewMode("list"); setSelectedExam(null); }}
                className={`p-2.5 rounded-lg transition-colors duration-150 ${isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
              >
                <FaArrowLeft />
              </button>
              <div>
                <h1 className={`text-3xl font-bold transition-colors duration-200 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {viewMode === "create" ? (language === "bn" ? "নতুন পরীক্ষা তৈরি করুন" : "Create New Exam") : (language === "bn" ? "পরীক্ষা সম্পাদনা করুন" : "Edit Exam")}
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {viewMode === "create" ? (language === "bn" ? "নতুন পরীক্ষার তথ্য পূরণ করুন" : "Fill in the details for the new exam") : (language === "bn" ? "পরীক্ষার তথ্য আপডেট করুন" : "Update the exam details")}
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <form onSubmit={viewMode === "create" ? handleCreateExam : handleUpdateExam} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Exam Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {language === "bn" ? "পরীক্ষার নাম" : "Exam Name"} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={examForm.examName} onChange={(e) => setExamForm({ ...examForm, examName: e.target.value })} required className={inputClass(isDarkMode)} placeholder={language === "bn" ? "পরীক্ষার নাম লিখুন" : "Enter exam name"} />
                  </div>

                  {/* Exam Type */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {language === "bn" ? "পরীক্ষার ধরন" : "Exam Type"} <span className="text-red-500">*</span>
                    </label>
                    <select value={examForm.examType} onChange={(e) => setExamForm({ ...examForm, examType: e.target.value as any })} required className={inputClass(isDarkMode)}>
                      <option value="quiz">{language === "bn" ? "কুইজ" : "Quiz"}</option>
                      <option value="midterm">{language === "bn" ? "মিডটার্ম" : "Midterm"}</option>
                      <option value="final">{language === "bn" ? "ফাইনাল" : "Final"}</option>
                      <option value="assignment">{language === "bn" ? "অ্যাসাইনমেন্ট" : "Assignment"}</option>
                      <option value="other">{language === "bn" ? "অন্যান্য" : "Other"}</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {language === "bn" ? "বিষয়" : "Subject"} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={examForm.subject} onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })} required className={inputClass(isDarkMode)} placeholder={language === "bn" ? "বিষয়ের নাম লিখুন" : "Enter subject name"} />
                  </div>

                  {/* Class */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {language === "bn" ? "ক্লাস" : "Class"} <span className="text-red-500">*</span>
                    </label>
                    <select value={examForm.class} onChange={(e) => setExamForm({ ...examForm, class: e.target.value })} required className={inputClass(isDarkMode)}>
                      <option value="">{language === "bn" ? "ক্লাস নির্বাচন করুন" : "Select Class"}</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={`Class ${i + 1}`}>{language === "bn" ? "ক্লাস" : "Class"} {i + 1}</option>
                      ))}
                    </select>
                  </div>

                  {/* Batch */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {language === "bn" ? "ব্যাচ" : "Batch"}
                    </label>
                    <input type="text" value={examForm.batchName} onChange={(e) => setExamForm({ ...examForm, batchName: e.target.value })} className={inputClass(isDarkMode)} placeholder={language === "bn" ? "ব্যাচের নাম (ঐচ্ছিক)" : "Batch name (optional)"} />
                  </div>

                  {/* Exam Date */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {language === "bn" ? "পরীক্ষার তারিখ" : "Exam Date"} <span className="text-red-500">*</span>
                    </label>
                    <input type="date" value={examForm.examDate} onChange={(e) => setExamForm({ ...examForm, examDate: e.target.value })} required className={inputClass(isDarkMode)} />
                  </div>

                  {/* Exam Time */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {language === "bn" ? "পরীক্ষার সময়" : "Exam Time"} <span className="text-red-500">*</span>
                    </label>
                    <input type="text" value={examForm.examTime} onChange={(e) => setExamForm({ ...examForm, examTime: e.target.value })} placeholder={language === "bn" ? "যেমন: ৯:০০ AM - ১১:০০ AM" : "e.g. 9:00 AM - 11:00 AM"} required className={inputClass(isDarkMode)} />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                      {language === "bn" ? "সময়কাল (মিনিট)" : "Duration (minutes)"}
                    </label>
                    <input type="number" value={examForm.duration} onChange={(e) => setExamForm({ ...examForm, duration: e.target.value })} min="1" className={inputClass(isDarkMode)} placeholder="60" />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                    {language === "bn" ? "বিবরণ" : "Description"}
                  </label>
                  <textarea
                    value={examForm.description}
                    onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                    rows={3}
                    placeholder={language === "bn" ? "পরীক্ষার বিবরণ লিখুন (ঐচ্ছিক)" : "Enter exam description (optional)"}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${isDarkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"}`}
                  />
                </div>

                {/* Form Actions */}
                <div className={`flex gap-3 justify-end pt-4 border-t ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                  <button
                    type="button"
                    onClick={() => { setViewMode("list"); setSelectedExam(null); }}
                    className={`px-6 py-2.5 border rounded-lg font-medium transition-colors duration-200 ${isDarkMode ? "border-gray-600 hover:bg-gray-700 text-gray-300" : "border-gray-300 hover:bg-gray-50 text-gray-700"}`}
                  >
                    {language === "bn" ? "বাতিল" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {isPending
                      ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...")
                      : viewMode === "create"
                      ? (language === "bn" ? "তৈরি করুন" : "Create Exam")
                      : (language === "bn" ? "আপডেট করুন" : "Update Exam")}
                  </button>
                </div>
              </form>
            </div>
          </>
        )}

        {/* ── RESULTS VIEW ──────────────────────────────────────── */}
        {viewMode === "results" && selectedExam && (
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setViewMode("list"); setSelectedExam(null); }}
                className={`p-2.5 rounded-lg transition-colors duration-150 ${isDarkMode ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
              >
                <FaArrowLeft />
              </button>
              <div className="flex-1">
                <h1 className={`text-3xl font-bold transition-colors duration-200 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {selectedExam.examName}
                </h1>
                <p className={`text-sm mt-1 transition-colors duration-200 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                  {selectedExam.subject} · {selectedExam.class}
                  {selectedExam.batchName && ` · ${selectedExam.batchName}`}
                  {" · "}{new Date(selectedExam.examDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US")}
                </p>
              </div>
              {!selectedExam.resultSmsSent && (
                <button
                  onClick={handleSendResultSMS}
                  disabled={isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                >
                  <FaSms />
                  {language === "bn" ? "ফলাফল SMS পাঠান" : "Send Result SMS"}
                </button>
              )}
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
                <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {language === "bn" ? "পরীক্ষার পরিসংখ্যান" : "Exam Statistics"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: language === "bn" ? "মোট ছাত্র" : "Total", value: stats.total, color: isDarkMode ? "text-gray-100" : "text-gray-900" },
                    { label: language === "bn" ? "উপস্থিত" : "Present", value: stats.present, color: isDarkMode ? "text-green-400" : "text-green-600" },
                    { label: language === "bn" ? "অনুপস্থিত" : "Absent", value: stats.absent, color: isDarkMode ? "text-red-400" : "text-red-600" },
                    { label: language === "bn" ? "পাস" : "Passed", value: stats.passed, color: isDarkMode ? "text-blue-400" : "text-blue-600" },
                  ].map((s) => (
                    <div key={s.label} className={`p-4 rounded-lg transition-colors duration-200 ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50"}`}>
                      <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{s.label}</p>
                      <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Results Entry Table */}
            <div className={`rounded-xl shadow-md overflow-hidden transition-colors duration-200 ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
              <div className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? "border-gray-700" : "border-gray-200"}`}>
                <h3 className={`text-lg font-semibold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                  {language === "bn" ? "ফলাফল এন্ট্রি" : "Result Entry"}
                </h3>
                <button
                  onClick={handleSaveResults}
                  disabled={isPending}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isPending ? (language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving...") : (language === "bn" ? "ফলাফল সংরক্ষণ করুন" : "Save Results")}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`transition-colors duration-200 ${isDarkMode ? "bg-gradient-to-r from-gray-700 to-gray-800" : "bg-gradient-to-r from-gray-50 to-gray-100"}`}>
                    <tr>
                      {[
                        { label: language === "bn" ? "ছাত্র আইডি" : "Student ID", cls: "text-left" },
                        { label: language === "bn" ? "ছাত্রের নাম" : "Student Name", cls: "text-left" },
                        { label: language === "bn" ? "উপস্থিতি" : "Attendance", cls: "text-center" },
                        { label: language === "bn" ? "মার্ক" : "Marks", cls: "text-center" },
                        { label: language === "bn" ? "মোট মার্ক" : "Total", cls: "text-center" },
                        { label: language === "bn" ? "গ্রেড" : "Grade", cls: "text-center" },
                        { label: language === "bn" ? "%" : "%", cls: "text-center" },
                      ].map((h) => (
                        <th key={h.label} className={`px-6 py-4 ${h.cls} text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className={`divide-y transition-colors duration-200 ${isDarkMode ? "bg-gray-800 divide-gray-700" : "bg-white divide-gray-200"}`}>
                    {admissions.map((admission) => {
                      const form = resultForm[admission._id] || { marks: "", totalMarks: "", grade: "", present: true };
                      const pct = form.marks && form.totalMarks
                        ? ((parseFloat(form.marks) / parseFloat(form.totalMarks)) * 100).toFixed(1)
                        : "—";
                      const existingResult = results.find((r) => (typeof r.admissionId === "string" ? r.admissionId : r.admissionId._id) === admission._id);

                      const smallInput = `w-20 px-2 py-1.5 border rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "border-gray-600 bg-gray-700 text-white disabled:opacity-40" : "border-gray-300 bg-white text-gray-900 disabled:opacity-40"}`;

                      return (
                        <tr key={admission._id} className={`transition-colors duration-150 ${isDarkMode ? "hover:bg-gray-700/50" : "hover:bg-gray-50"}`}>
                          <td className={`px-6 py-4 text-sm whitespace-nowrap ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {admission.studentId || "—"}
                          </td>
                          <td className={`px-6 py-4 text-sm font-medium whitespace-nowrap ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                            {admission.studentName}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => setResultForm({ ...resultForm, [admission._id]: { ...form, present: true } })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.present ? "bg-green-600 text-white shadow-sm" : isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                              >
                                <FaCheck className="inline mr-1 text-[10px]" />
                                {language === "bn" ? "উপস্থিত" : "P"}
                              </button>
                              <button
                                onClick={() => setResultForm({ ...resultForm, [admission._id]: { ...form, present: false } })}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!form.present ? "bg-red-600 text-white shadow-sm" : isDarkMode ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                              >
                                <FaTimes className="inline mr-1 text-[10px]" />
                                {language === "bn" ? "অনুপস্থিত" : "A"}
                              </button>
                              {existingResult?.absentSmsSent && (
                                <FaSms className={`text-sm ${isDarkMode ? "text-green-400" : "text-green-500"}`} title={language === "bn" ? "SMS পাঠানো হয়েছে" : "SMS sent"} />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input type="number" value={form.marks} onChange={(e) => setResultForm({ ...resultForm, [admission._id]: { ...form, marks: e.target.value } })} min="0" step="0.01" disabled={!form.present} className={smallInput} placeholder="0" />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input type="number" value={form.totalMarks} onChange={(e) => setResultForm({ ...resultForm, [admission._id]: { ...form, totalMarks: e.target.value } })} min="1" step="0.01" disabled={!form.present} className={smallInput} placeholder="100" />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <input type="text" value={form.grade} onChange={(e) => setResultForm({ ...resultForm, [admission._id]: { ...form, grade: e.target.value } })} placeholder="A+" disabled={!form.present} className={`w-16 px-2 py-1.5 border rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${isDarkMode ? "border-gray-600 bg-gray-700 text-white disabled:opacity-40" : "border-gray-300 bg-white text-gray-900 disabled:opacity-40"}`} />
                          </td>
                          <td className={`px-6 py-4 text-center text-sm font-semibold ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {pct !== "—" ? `${pct}%` : pct}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
