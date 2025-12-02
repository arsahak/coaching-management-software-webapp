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
  FaChartBar,
  FaCheck,
  FaEdit,
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

export default function ExamManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [viewMode, setViewMode] = useState<
    "list" | "create" | "edit" | "results"
  >("list");
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

  // Form state for exam
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

  // Form state for results
  const [resultForm, setResultForm] = useState<
    Record<
      string,
      {
        marks: string;
        totalMarks: string;
        grade: string;
        present: boolean;
      }
    >
  >({});

  // Load exams
  useEffect(() => {
    loadExams();
  }, [filters, search]);

  // Load results when exam is selected
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
        const data = Array.isArray(result.data) ? result.data : [];
        setExams(data as Exam[]);
      }
    });
  };

  const loadResults = async () => {
    if (!selectedExam) return;

    startTransition(async () => {
      const result = await getExamResults(selectedExam._id);

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setResults(data as ExamResult[]);

        // Initialize result form
        const form: Record<string, any> = {};
        data.forEach((res: ExamResult) => {
          const admissionId =
            typeof res.admissionId === "string"
              ? res.admissionId
              : res.admissionId._id;
          form[admissionId] = {
            marks: res.marks.toString(),
            totalMarks: res.totalMarks.toString(),
            grade: res.grade || "",
            present: res.present,
          };
        });
        setResultForm(form);
      }
    });
  };

  const loadAdmissions = async () => {
    if (!selectedExam) return;

    startTransition(async () => {
      const result = await getAdmissions(1, 1000, "", {
        class: selectedExam.class,
        batch: selectedExam.batchName,
        status: "active",
      });

      if (result.success && result.data) {
        const data = Array.isArray(result.data) ? result.data : [];
        setAdmissions(data as Admission[]);

        // Initialize result form for students without results
        const form = { ...resultForm };
        data.forEach((adm: Admission) => {
          if (!form[adm._id]) {
            form[adm._id] = {
              marks: "",
              totalMarks: "",
              grade: "",
              present: true,
            };
          }
        });
        setResultForm(form);
      }
    });
  };

  const loadStats = async () => {
    if (!selectedExam) return;

    startTransition(async () => {
      const result = await getExamStats(selectedExam._id);

      if (result.success && result.data) {
        setStats(result.data);
      }
    });
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await createExam({
        ...examForm,
        duration: examForm.duration ? parseInt(examForm.duration) : undefined,
      });

      if (result.success) {
        toast.success(
          language === "bn"
            ? "পরীক্ষা সফলভাবে তৈরি করা হয়েছে"
            : "Exam created successfully"
        );
        setViewMode("list");
        setExamForm({
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
        loadExams();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "পরীক্ষা তৈরি করতে ব্যর্থ"
              : "Failed to create exam")
        );
      }
    });
  };

  const handleUpdateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExam) return;

    startTransition(async () => {
      const result = await updateExam(selectedExam._id, {
        ...examForm,
        duration: examForm.duration ? parseInt(examForm.duration) : undefined,
      });

      if (result.success) {
        toast.success(
          language === "bn"
            ? "পরীক্ষা সফলভাবে আপডেট করা হয়েছে"
            : "Exam updated successfully"
        );
        setViewMode("list");
        setSelectedExam(null);
        loadExams();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "পরীক্ষা আপডেট করতে ব্যর্থ"
              : "Failed to update exam")
        );
      }
    });
  };

  const handleDeleteExam = async (id: string) => {
    if (
      !confirm(
        language === "bn"
          ? "আপনি কি এই পরীক্ষা মুছে ফেলতে চান?"
          : "Are you sure you want to delete this exam?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteExam(id);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "পরীক্ষা সফলভাবে মুছে ফেলা হয়েছে"
            : "Exam deleted successfully"
        );
        loadExams();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "পরীক্ষা মুছতে ব্যর্থ"
              : "Failed to delete exam")
        );
      }
    });
  };

  const handleSendScheduleSMS = async (examId: string) => {
    startTransition(async () => {
      const result = await sendExamScheduleSMS(examId);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "পরীক্ষার সময়সূচী এসএমএস সফলভাবে পাঠানো হয়েছে"
            : "Exam schedule SMS sent successfully"
        );
        loadExams();
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "এসএমএস পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const handleSaveResults = async () => {
    if (!selectedExam) return;

    const resultsToSave = admissions
      .filter((adm) => {
        const form = resultForm[adm._id];
        return form && form.marks && form.totalMarks;
      })
      .map((adm) => {
        const form = resultForm[adm._id];
        return {
          admissionId: adm._id,
          marks: parseFloat(form.marks),
          totalMarks: parseFloat(form.totalMarks),
          grade: form.grade || undefined,
          present: form.present,
        };
      });

    if (resultsToSave.length === 0) {
      toast.error(language === "bn" ? "কোন ফলাফল নেই" : "No results to save");
      return;
    }

    startTransition(async () => {
      const result = await createBatchExamResults(
        selectedExam._id,
        resultsToSave
      );

      if (result.success) {
        toast.success(
          language === "bn"
            ? `${resultsToSave.length} জন ছাত্রের ফলাফল সফলভাবে সংরক্ষণ করা হয়েছে`
            : `Results saved for ${resultsToSave.length} student(s)`
        );
        loadResults();
        loadStats();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "ফলাফল সংরক্ষণ করতে ব্যর্থ"
              : "Failed to save results")
        );
      }
    });
  };

  const handleSendResultSMS = async () => {
    if (!selectedExam) return;

    startTransition(async () => {
      const result = await sendExamResultSMS(selectedExam._id);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "ফলাফল এসএমএস সফলভাবে পাঠানো হয়েছে"
            : "Result SMS sent successfully"
        );
        loadResults();
        loadExams();
      } else {
        toast.error(
          result.error ||
            (language === "bn" ? "এসএমএস পাঠাতে ব্যর্থ" : "Failed to send SMS")
        );
      }
    });
  };

  const handleEdit = (exam: Exam) => {
    setSelectedExam(exam);
    setExamForm({
      examName: exam.examName,
      examType: exam.examType,
      subject: exam.subject,
      class: exam.class,
      batchName: exam.batchName || "",
      description: exam.description || "",
      examDate: new Date(exam.examDate).toISOString().split("T")[0],
      examTime: exam.examTime,
      duration: exam.duration?.toString() || "",
    });
    setViewMode("edit");
  };

  const handleViewResults = (exam: Exam) => {
    setSelectedExam(exam);
    setViewMode("results");
  };

  const filteredExams = exams.filter((exam) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        exam.examName.toLowerCase().includes(searchLower) ||
        exam.subject.toLowerCase().includes(searchLower) ||
        exam.class.toLowerCase().includes(searchLower)
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
            {language === "bn" ? "পরীক্ষা ব্যবস্থাপনা" : "Exam Management"}
          </h1>
          <p
            className={`text-sm transition-colors duration-200 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {language === "bn"
              ? "পরীক্ষার সময়সূচী, ফলাফল এবং এসএমএস ব্যবস্থাপনা"
              : "Manage exam schedules, results, and SMS notifications"}
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
                          ? "পরীক্ষার নাম, বিষয়..."
                          : "Search exam name, subject..."
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

                <div className="flex gap-2">
                  <select
                    value={filters.class || ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        class: e.target.value || undefined,
                      })
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
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        status: e.target.value || undefined,
                      })
                    }
                    className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">
                      {language === "bn" ? "সব স্ট্যাটাস" : "All Status"}
                    </option>
                    <option value="scheduled">
                      {language === "bn" ? "নির্ধারিত" : "Scheduled"}
                    </option>
                    <option value="completed">
                      {language === "bn" ? "সম্পন্ন" : "Completed"}
                    </option>
                    <option value="cancelled">
                      {language === "bn" ? "বাতিল" : "Cancelled"}
                    </option>
                  </select>

                  <button
                    onClick={() => {
                      setSelectedExam(null);
                      setExamForm({
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
                      setViewMode("create");
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
                  >
                    <FaPlus />
                    {language === "bn" ? "নতুন পরীক্ষা" : "New Exam"}
                  </button>
                </div>
              </div>
            </div>

            {/* Exams Table */}
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
                        {language === "bn" ? "পরীক্ষার নাম" : "Exam Name"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "বিষয়" : "Subject"}
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
                        {language === "bn" ? "তারিখ" : "Date"}
                      </th>
                      <th
                        className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "সময়" : "Time"}
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
                    {filteredExams.map((exam) => (
                      <tr
                        key={exam._id}
                        className={`transition-colors duration-200 ${
                          isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        }`}
                      >
                        <td
                          className={`px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {exam.examName}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm transition-colors duration-200 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {exam.subject}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm transition-colors duration-200 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {exam.class}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm transition-colors duration-200 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {new Date(exam.examDate).toLocaleDateString(
                            language === "bn" ? "bn-BD" : "en-US"
                          )}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm transition-colors duration-200 ${
                            isDarkMode ? "text-gray-300" : "text-gray-900"
                          }`}
                        >
                          {exam.examTime}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              exam.status === "completed"
                                ? "bg-green-100 text-green-800 " +
                                  (isDarkMode
                                    ? "dark:bg-green-900/30 dark:text-green-400"
                                    : "")
                                : exam.status === "scheduled"
                                ? "bg-blue-100 text-blue-800 " +
                                  (isDarkMode
                                    ? "dark:bg-blue-900/30 dark:text-blue-400"
                                    : "")
                                : "bg-gray-100 text-gray-800 " +
                                  (isDarkMode
                                    ? "dark:bg-gray-700 dark:text-gray-300"
                                    : "")
                            }`}
                          >
                            {exam.status === "completed"
                              ? language === "bn"
                                ? "সম্পন্ন"
                                : "Completed"
                              : exam.status === "scheduled"
                              ? language === "bn"
                                ? "নির্ধারিত"
                                : "Scheduled"
                              : language === "bn"
                              ? "বাতিল"
                              : "Cancelled"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleViewResults(exam)}
                              className={`p-2 rounded-lg transition-all ${
                                isDarkMode
                                  ? "text-blue-400 hover:bg-gray-700"
                                  : "text-blue-600 hover:bg-blue-50"
                              }`}
                              title={language === "bn" ? "ফলাফল" : "Results"}
                            >
                              <FaChartBar />
                            </button>
                            <button
                              onClick={() => handleEdit(exam)}
                              className={`p-2 rounded-lg transition-all ${
                                isDarkMode
                                  ? "text-yellow-400 hover:bg-gray-700"
                                  : "text-yellow-600 hover:bg-yellow-50"
                              }`}
                              title={language === "bn" ? "সম্পাদনা" : "Edit"}
                            >
                              <FaEdit />
                            </button>
                            {!exam.scheduleSmsSent && (
                              <button
                                onClick={() => handleSendScheduleSMS(exam._id)}
                                disabled={isPending}
                                className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                                  isDarkMode
                                    ? "text-green-400 hover:bg-gray-700"
                                    : "text-green-600 hover:bg-green-50"
                                }`}
                                title={
                                  language === "bn"
                                    ? "সময়সূচী এসএমএস পাঠান"
                                    : "Send Schedule SMS"
                                }
                              >
                                <FaSms />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteExam(exam._id)}
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
                    ))}
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
                  ? "নতুন পরীক্ষা তৈরি করুন"
                  : "Create New Exam"
                : language === "bn"
                ? "পরীক্ষা সম্পাদনা করুন"
                : "Edit Exam"}
            </h2>

            <form
              onSubmit={
                viewMode === "create" ? handleCreateExam : handleUpdateExam
              }
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "পরীক্ষার নাম" : "Exam Name"} *
                  </label>
                  <input
                    type="text"
                    value={examForm.examName}
                    onChange={(e) =>
                      setExamForm({ ...examForm, examName: e.target.value })
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
                    {language === "bn" ? "পরীক্ষার ধরন" : "Exam Type"} *
                  </label>
                  <select
                    value={examForm.examType}
                    onChange={(e) =>
                      setExamForm({
                        ...examForm,
                        examType: e.target.value as any,
                      })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="quiz">
                      {language === "bn" ? "কুইজ" : "Quiz"}
                    </option>
                    <option value="midterm">
                      {language === "bn" ? "মিডটার্ম" : "Midterm"}
                    </option>
                    <option value="final">
                      {language === "bn" ? "ফাইনাল" : "Final"}
                    </option>
                    <option value="assignment">
                      {language === "bn" ? "অ্যাসাইনমেন্ট" : "Assignment"}
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
                    {language === "bn" ? "বিষয়" : "Subject"} *
                  </label>
                  <input
                    type="text"
                    value={examForm.subject}
                    onChange={(e) =>
                      setExamForm({ ...examForm, subject: e.target.value })
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
                    {language === "bn" ? "ক্লাস" : "Class"} *
                  </label>
                  <select
                    value={examForm.class}
                    onChange={(e) =>
                      setExamForm({ ...examForm, class: e.target.value })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="">
                      {language === "bn"
                        ? "ক্লাস নির্বাচন করুন"
                        : "Select Class"}
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
                    value={examForm.batchName}
                    onChange={(e) =>
                      setExamForm({ ...examForm, batchName: e.target.value })
                    }
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
                    {language === "bn" ? "পরীক্ষার তারিখ" : "Exam Date"} *
                  </label>
                  <input
                    type="date"
                    value={examForm.examDate}
                    onChange={(e) =>
                      setExamForm({ ...examForm, examDate: e.target.value })
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
                    {language === "bn" ? "পরীক্ষার সময়" : "Exam Time"} *
                  </label>
                  <input
                    type="text"
                    value={examForm.examTime}
                    onChange={(e) =>
                      setExamForm({ ...examForm, examTime: e.target.value })
                    }
                    placeholder={
                      language === "bn"
                        ? "যেমন: ৯:০০ AM - ১১:০০ AM"
                        : "e.g., 9:00 AM - 11:00 AM"
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
                    {language === "bn"
                      ? "সময়কাল (মিনিট)"
                      : "Duration (minutes)"}
                  </label>
                  <input
                    type="number"
                    value={examForm.duration}
                    onChange={(e) =>
                      setExamForm({ ...examForm, duration: e.target.value })
                    }
                    min="1"
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
                  {language === "bn" ? "বিবরণ" : "Description"}
                </label>
                <textarea
                  value={examForm.description}
                  onChange={(e) =>
                    setExamForm({ ...examForm, description: e.target.value })
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
                    setSelectedExam(null);
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
                    : viewMode === "create"
                    ? language === "bn"
                      ? "তৈরি করুন"
                      : "Create"
                    : language === "bn"
                    ? "আপডেট করুন"
                    : "Update"}
                </button>
              </div>
            </form>
          </div>
        )}

        {viewMode === "results" && selectedExam && (
          <div className="space-y-6">
            {/* Exam Info */}
            <div
              className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2
                    className={`text-xl font-semibold transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {selectedExam.examName}
                  </h2>
                  <p
                    className={`text-sm mt-1 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedExam.subject} - {selectedExam.class} -{" "}
                    {new Date(selectedExam.examDate).toLocaleDateString(
                      language === "bn" ? "bn-BD" : "en-US"
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  {!selectedExam.resultSmsSent && (
                    <button
                      onClick={handleSendResultSMS}
                      disabled={isPending}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                      <FaSms />
                      {language === "bn"
                        ? "ফলাফল এসএমএস পাঠান"
                        : "Send Result SMS"}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setViewMode("list");
                      setSelectedExam(null);
                    }}
                    className={`px-4 py-2 border rounded-lg font-medium transition-colors duration-200 ${
                      isDarkMode
                        ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                        : "border-gray-300 hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "ফিরে যান" : "Back"}
                  </button>
                </div>
              </div>

              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div
                    className={`p-4 rounded-lg transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
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
                    className={`p-4 rounded-lg transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
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
                    className={`p-4 rounded-lg transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
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
                    className={`p-4 rounded-lg transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <p
                      className={`text-sm mb-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {language === "bn" ? "পাস" : "Passed"}
                    </p>
                    <p
                      className={`text-2xl font-bold text-blue-600 transition-colors duration-200 ${
                        isDarkMode ? "text-blue-400" : ""
                      }`}
                    >
                      {stats.passed}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Results Table */}
            <div
              className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <h3
                  className={`text-lg font-semibold transition-colors duration-200 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {language === "bn" ? "ফলাফল" : "Results"}
                </h3>
                <button
                  onClick={handleSaveResults}
                  disabled={isPending}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {language === "bn" ? "সংরক্ষণ করুন" : "Save Results"}
                </button>
              </div>

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
                        className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "উপস্থিতি" : "Attendance"}
                      </th>
                      <th
                        className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "মার্ক" : "Marks"}
                      </th>
                      <th
                        className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "মোট মার্ক" : "Total Marks"}
                      </th>
                      <th
                        className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "গ্রেড" : "Grade"}
                      </th>
                      <th
                        className={`px-4 py-3 text-center text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {language === "bn" ? "শতকরা" : "Percentage"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {admissions.map((admission) => {
                      const form = resultForm[admission._id] || {
                        marks: "",
                        totalMarks: "",
                        grade: "",
                        present: true,
                      };
                      const percentage =
                        form.marks && form.totalMarks
                          ? (
                              (parseFloat(form.marks) /
                                parseFloat(form.totalMarks)) *
                              100
                            ).toFixed(2)
                          : "0.00";
                      const existingResult = results.find(
                        (r) =>
                          (typeof r.admissionId === "string"
                            ? r.admissionId
                            : r.admissionId._id) === admission._id
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
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setResultForm({
                                    ...resultForm,
                                    [admission._id]: {
                                      ...form,
                                      present: true,
                                    },
                                  });
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                  form.present
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
                                onClick={() => {
                                  setResultForm({
                                    ...resultForm,
                                    [admission._id]: {
                                      ...form,
                                      present: false,
                                    },
                                  });
                                }}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                  !form.present
                                    ? "bg-red-600 text-white"
                                    : isDarkMode
                                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                <FaTimes className="inline mr-1" />
                                {language === "bn" ? "অনুপস্থিত" : "Absent"}
                              </button>
                              {existingResult?.absentSmsSent && (
                                <FaSms
                                  className={`text-green-500 transition-colors duration-200 ${
                                    isDarkMode ? "text-green-400" : ""
                                  }`}
                                  title={
                                    language === "bn"
                                      ? "অনুপস্থিতি এসএমএস পাঠানো হয়েছে"
                                      : "Absent SMS sent"
                                  }
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={form.marks}
                              onChange={(e) => {
                                setResultForm({
                                  ...resultForm,
                                  [admission._id]: {
                                    ...form,
                                    marks: e.target.value,
                                  },
                                });
                              }}
                              min="0"
                              step="0.01"
                              disabled={!form.present}
                              className={`w-20 px-2 py-1 border rounded text-center transition-all ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 text-white disabled:opacity-50"
                                  : "border-gray-300 bg-white text-gray-900 disabled:opacity-50"
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              value={form.totalMarks}
                              onChange={(e) => {
                                setResultForm({
                                  ...resultForm,
                                  [admission._id]: {
                                    ...form,
                                    totalMarks: e.target.value,
                                  },
                                });
                              }}
                              min="1"
                              step="0.01"
                              disabled={!form.present}
                              className={`w-20 px-2 py-1 border rounded text-center transition-all ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 text-white disabled:opacity-50"
                                  : "border-gray-300 bg-white text-gray-900 disabled:opacity-50"
                              }`}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={form.grade}
                              onChange={(e) => {
                                setResultForm({
                                  ...resultForm,
                                  [admission._id]: {
                                    ...form,
                                    grade: e.target.value,
                                  },
                                });
                              }}
                              placeholder="A+"
                              disabled={!form.present}
                              className={`w-16 px-2 py-1 border rounded text-center transition-all ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-700 text-white disabled:opacity-50"
                                  : "border-gray-300 bg-white text-gray-900 disabled:opacity-50"
                              }`}
                            />
                          </td>
                          <td
                            className={`px-4 py-3 text-sm text-center font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-900"
                            }`}
                          >
                            {percentage}%
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
