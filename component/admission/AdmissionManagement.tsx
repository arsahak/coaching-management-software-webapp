"use client";

import { deleteAdmission, getAdmissions } from "@/app/actions/admission";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  FaEdit,
  FaEye,
  FaFilter,
  FaPrint,
  FaSearch,
  FaTrash,
  FaUserPlus,
} from "react-icons/fa";

interface Admission {
  _id: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  schoolName: string;
  fatherMobile: string;
  motherMobile?: string;
  studentMobile?: string;
  class: string;
  subjects: string[];
  batchName: string;
  batchTime: string;
  admissionDate: string;
  monthlyFee: number;
  studentId?: string;
  status: "active" | "inactive" | "completed";
  notes?: string;
  alarmMobile?: string[];
  smsHistory?: string[];
  emailHistory?: string[];
}

interface AdmissionManagementProps {
  initialData: Admission[];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  initialSearch?: string;
  initialFilters?: {
    class?: string;
    batch?: string;
    status?: string;
  };
}

export default function AdmissionManagement({
  initialData,
  initialPagination,
  initialSearch = "",
  initialFilters = {},
}: AdmissionManagementProps) {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [admissions, setAdmissions] = useState<Admission[]>(initialData);
  const [pagination, setPagination] = useState(initialPagination);
  const [search, setSearch] = useState(initialSearch);
  const [filters, setFilters] = useState(initialFilters);

  const handleSearch = (value: string) => {
    setSearch(value);
    updateURL({ search: value, page: "1" });
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    updateURL({ ...newFilters, page: "1" });
  };

  const updateURL = (params: Record<string, string>) => {
    const current = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        current.set(key, value);
      } else {
        current.delete(key);
      }
    });
    router.push(`/admission?${current.toString()}`);
  };

  const refreshData = async () => {
    startTransition(async () => {
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const result = await getAdmissions(page, limit, search, {
        class: filters.class || undefined,
        batch: filters.batch || undefined,
        status: filters.status || undefined,
      });

      if (result.success && result.data) {
        setAdmissions(result.data);
        setPagination(result.pagination);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        getTranslation("confirmDelete", language) ||
          "Are you sure you want to delete this admission?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAdmission(id);

      if (result.success) {
        toast.success(
          result.message ||
            getTranslation("deleteSuccess", language) ||
            "Admission deleted successfully"
        );
        refreshData();
      } else {
        toast.error(
          result.error ||
            getTranslation("deleteError", language) ||
            "Failed to delete admission"
        );
      }
    });
  };

  const handleEdit = (admission: Admission) => {
    router.push(`/admission/edit/${admission._id}`);
  };

  const handleView = (admission: Admission) => {
    router.push(`/admission/${admission._id}`);
  };

  const handlePrint = (admission: Admission) => {
    router.push(`/admission/${admission._id}`);
  };

  return (
    <>
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div>
              <h1
                className={`text-3xl font-bold transition-colors duration-200 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {getTranslation("admission", language) ||
                  "Admission Management"}
              </h1>
              <p
                className={`text-sm mt-1 transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {getTranslation("manageAdmissions", language) ||
                  "Manage and track all student admissions"}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <button
                onClick={() => router.push("/admission/new-admission")}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <FaUserPlus className="text-lg" />
                <span>
                  {getTranslation("addAdmission", language) || "Add Admission"}
                </span>
              </button>
            </div>
          </div>

          {/* Search and Filters Card */}
          <div
            className={`p-6 rounded-xl shadow-md transition-colors duration-200 mb-8 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <FaFilter
                className={`transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              />
              <h2
                className={`text-lg font-semibold transition-colors duration-200 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {getTranslation("searchAndFilter", language) ||
                  "Search & Filter"}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <FaSearch
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-500" : "text-gray-400"
                  }`}
                />
                <input
                  type="text"
                  placeholder={
                    getTranslation("searchPlaceholder", language) ||
                    "Search students..."
                  }
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode
                      ? "bg-gray-700 text-white border-gray-600 placeholder-gray-500"
                      : "bg-white text-gray-900 border-gray-300 placeholder-gray-400"
                  }`}
                />
              </div>

              {/* Class Filter */}
              <select
                value={filters.class || ""}
                onChange={(e) => handleFilterChange("class", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <option value="">
                  {getTranslation("allClasses", language) || "All Classes"}
                </option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={`Class ${i + 1}`}>
                    {getTranslation("class", language) || "Class"} {i + 1}
                  </option>
                ))}
              </select>

              {/* Batch Filter */}
              <select
                value={filters.batch || ""}
                onChange={(e) => handleFilterChange("batch", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <option value="">
                  {getTranslation("allBatches", language) || "All Batches"}
                </option>
              </select>

              {/* Status Filter */}
              <select
                value={filters.status || ""}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300"
                }`}
              >
                <option value="">
                  {getTranslation("allStatus", language) || "All Status"}
                </option>
                <option value="active">
                  {getTranslation("active", language) || "Active"}
                </option>
                <option value="inactive">
                  {getTranslation("inactive", language) || "Inactive"}
                </option>
                <option value="completed">
                  {getTranslation("completed", language) || "Completed"}
                </option>
              </select>
            </div>
          </div>

          {/* Admissions Table Card */}
          <div
            className={`rounded-xl shadow-md overflow-hidden transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead
                  className={`transition-colors duration-200 ${
                    isDarkMode
                      ? "bg-gradient-to-r from-gray-700 to-gray-800"
                      : "bg-gradient-to-r from-gray-50 to-gray-100"
                  }`}
                >
                  <tr>
                    <th
                      className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {getTranslation("studentId", language) || "Student ID"}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {getTranslation("studentName", language) ||
                        "Student Name"}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {getTranslation("class", language) || "Class"}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {getTranslation("batchName", language) || "Batch"}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {getTranslation("monthlyFee", language) || "Monthly Fee"}
                    </th>
                    <th
                      className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {getTranslation("status", language) || "Status"}
                    </th>
                    <th
                      className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {getTranslation("actions", language) || "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y transition-colors duration-200 ${
                    isDarkMode
                      ? "bg-gray-800 divide-gray-700"
                      : "bg-white divide-gray-200"
                  }`}
                >
                  {admissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <div
                            className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors duration-200 ${
                              isDarkMode ? "bg-gray-700" : "bg-gray-100"
                            }`}
                          >
                            <FaSearch
                              className={`text-xl transition-colors duration-200 ${
                                isDarkMode ? "text-gray-500" : "text-gray-400"
                              }`}
                            />
                          </div>
                          <p
                            className={`text-lg font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {getTranslation("noAdmissions", language) ||
                              "No admissions found"}
                          </p>
                          <p
                            className={`text-sm mt-1 transition-colors duration-200 ${
                              isDarkMode ? "text-gray-500" : "text-gray-400"
                            }`}
                          >
                            {getTranslation("tryDifferentSearch", language) ||
                              "Try adjusting your search or filters"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    admissions.map((admission) => (
                      <tr
                        key={admission._id}
                        className={`transition-colors duration-150 ${
                          isDarkMode
                            ? "hover:bg-gray-700/50"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {admission.studentId || (
                              <span
                                className={`transition-colors duration-200 ${
                                  isDarkMode ? "text-gray-500" : "text-gray-400"
                                }`}
                              >
                                -
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-medium transition-colors duration-200 ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {admission.studentName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {admission.class}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm transition-colors duration-200 ${
                              isDarkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {admission.batchName}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`text-sm font-semibold transition-colors duration-200 ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            ৳{admission.monthlyFee.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                              admission.status === "active"
                                ? isDarkMode
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-green-100 text-green-800"
                                : admission.status === "inactive"
                                ? isDarkMode
                                  ? "bg-yellow-900/30 text-yellow-400"
                                  : "bg-yellow-100 text-yellow-800"
                                : isDarkMode
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {admission.status === "active"
                              ? getTranslation("active", language) || "Active"
                              : admission.status === "inactive"
                              ? getTranslation("inactive", language) ||
                                "Inactive"
                              : getTranslation("completed", language) ||
                                "Completed"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleView(admission)}
                              className={`p-2 rounded-lg transition-colors duration-150 ${
                                isDarkMode
                                  ? "text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              }`}
                              title={getTranslation("view", language) || "View"}
                            >
                              <FaEye className="text-base" />
                            </button>
                            <button
                              onClick={() => handleEdit(admission)}
                              className={`p-2 rounded-lg transition-colors duration-150 ${
                                isDarkMode
                                  ? "text-green-400 hover:text-green-300 hover:bg-green-900/20"
                                  : "text-green-600 hover:text-green-700 hover:bg-green-50"
                              }`}
                              title={getTranslation("edit", language) || "Edit"}
                            >
                              <FaEdit className="text-base" />
                            </button>
                            <button
                              onClick={() => handlePrint(admission)}
                              className={`p-2 rounded-lg transition-colors duration-150 ${
                                isDarkMode
                                  ? "text-purple-400 hover:text-purple-300 hover:bg-purple-900/20"
                                  : "text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              }`}
                              title={
                                getTranslation("print", language) || "Print"
                              }
                            >
                              <FaPrint className="text-base" />
                            </button>
                            <button
                              onClick={() => handleDelete(admission._id)}
                              className={`p-2 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                                isDarkMode
                                  ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  : "text-red-600 hover:text-red-700 hover:bg-red-50"
                              }`}
                              title={
                                getTranslation("delete", language) || "Delete"
                              }
                              disabled={isPending}
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

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div
                className={`px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gray-700/50 border-gray-700"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <div
                  className={`text-sm transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {getTranslation("showing", language) || "Showing"}{" "}
                  <span className="font-medium">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  {getTranslation("to", language) || "to"}{" "}
                  <span className="font-medium">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  {getTranslation("of", language) || "of"}{" "}
                  <span className="font-medium">{pagination.total}</span>{" "}
                  {getTranslation("results", language) || "results"}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateURL({ page: String(pagination.page - 1) })
                    }
                    disabled={!pagination.hasPrev}
                    className={`px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {getTranslation("previous", language) || "Previous"}
                  </button>
                  <button
                    onClick={() =>
                      updateURL({ page: String(pagination.page + 1) })
                    }
                    disabled={!pagination.hasNext}
                    className={`px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white hover:bg-gray-600"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {getTranslation("next", language) || "Next"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
