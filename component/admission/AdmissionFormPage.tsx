"use client";

import { createAdmission, updateAdmission } from "@/app/actions/admission";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft } from "react-icons/fa";

interface Admission {
  _id?: string;
  studentName?: string;
  fatherName?: string;
  motherName?: string;
  schoolName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  studentMobile?: string;
  class?: string;
  subjects?: string[];
  batchName?: string;
  batchTime?: string;
  admissionDate?: string;
  monthlyFee?: number;
  notes?: string;
}

interface AdmissionFormPageProps {
  admission?: Admission | null;
}

const DEFAULT_SUBJECTS = [
  "Mathematics",
  "English",
  "Bangla",
  "Science",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "ICT",
  "Economics",
  "Accounting",
  "Business Studies",
  "Statistics",
  "Higher Mathematics",
];

export default function AdmissionFormPage({
  admission,
}: AdmissionFormPageProps) {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [formData, setFormData] = useState({
    studentName: admission?.studentName || "",
    fatherName: admission?.fatherName || "",
    motherName: admission?.motherName || "",
    schoolName: admission?.schoolName || "",
    fatherMobile: admission?.fatherMobile || "",
    motherMobile: admission?.motherMobile || "",
    studentMobile: admission?.studentMobile || "",
    class: admission?.class || "", // Keep for backward compatibility
    subjects: admission?.subjects || [],
    batchName: admission?.batchName || "",
    batchTime: admission?.batchTime || "",
    admissionDate: admission?.admissionDate
      ? new Date(admission.admissionDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    monthlyFee: admission?.monthlyFee || 0,
    notes: admission?.notes || "",
  });

  const [customSubject, setCustomSubject] = useState("");
  const [availableSubjects, setAvailableSubjects] = useState<string[]>(() => {
    // Initialize with default subjects plus any custom subjects from existing admission
    const customSubjects =
      admission?.subjects?.filter((s) => !DEFAULT_SUBJECTS.includes(s)) || [];
    return [...DEFAULT_SUBJECTS, ...customSubjects];
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [alarmTargets, setAlarmTargets] = useState({
    father: true,
    mother: !!admission?.motherMobile,
    student: !!admission?.studentMobile,
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.studentName.trim()) {
      newErrors.studentName =
        getTranslation("required", language) || "Required";
    }
    if (!formData.fatherName.trim()) {
      newErrors.fatherName = getTranslation("required", language) || "Required";
    }
    if (!formData.motherName.trim()) {
      newErrors.motherName = getTranslation("required", language) || "Required";
    }
    if (!formData.schoolName.trim()) {
      newErrors.schoolName = getTranslation("required", language) || "Required";
    }
    if (!formData.fatherMobile.trim()) {
      newErrors.fatherMobile =
        getTranslation("required", language) || "Required";
    }
    // Subjects are now required instead of class
    if (formData.subjects.length === 0) {
      newErrors.subjects =
        getTranslation("atLeastOneSubject", language) ||
        "At least one subject is required";
    }
    if (!formData.batchName.trim()) {
      newErrors.batchName = getTranslation("required", language) || "Required";
    }
    if (!formData.batchTime.trim()) {
      newErrors.batchTime = getTranslation("required", language) || "Required";
    }
    if (!formData.admissionDate) {
      newErrors.admissionDate =
        getTranslation("required", language) || "Required";
    }
    if (formData.monthlyFee <= 0) {
      newErrors.monthlyFee = getTranslation("required", language) || "Required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    startTransition(async () => {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "subjects" && Array.isArray(value)) {
          value.forEach((subject) => formDataObj.append("subjects", subject));
        } else if (value !== undefined && value !== null && value !== "") {
          formDataObj.append(key, String(value));
        }
      });

      // Build alarmMobile list based on selected targets
      if (alarmTargets.father && formData.fatherMobile?.trim()) {
        formDataObj.append("alarmMobile", formData.fatherMobile.trim());
      }
      if (alarmTargets.mother && formData.motherMobile?.trim()) {
        formDataObj.append("alarmMobile", formData.motherMobile.trim());
      }
      if (alarmTargets.student && formData.studentMobile?.trim()) {
        formDataObj.append("alarmMobile", formData.studentMobile.trim());
      }

      const result = admission?._id
        ? await updateAdmission(admission._id, formDataObj)
        : await createAdmission(formDataObj);

      if (result.success) {
        toast.success(
          result.message ||
            (admission?._id
              ? getTranslation("updateSuccess", language) ||
                "Updated successfully"
              : getTranslation("createSuccess", language) ||
                "Created successfully")
        );

        // Redirect to admission detail page if created, or back to list if updated
        if (admission?._id) {
          router.push(`/admission/${admission._id}`);
        } else {
          // For new admission, redirect to the list or the new admission detail
          const newAdmissionId = (result.data as any)?._id;
          if (newAdmissionId) {
            router.push(`/admission/${newAdmissionId}`);
          } else {
            router.push("/admission");
          }
        }
        router.refresh();
      } else {
        toast.error(
          result.error ||
            (admission?._id
              ? getTranslation("updateError", language) || "Update failed"
              : getTranslation("createError", language) || "Create failed")
        );
      }
    });
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleAddCustomSubject = () => {
    const trimmedSubject = customSubject.trim();
    if (
      trimmedSubject &&
      !formData.subjects.includes(trimmedSubject) &&
      !availableSubjects.includes(trimmedSubject)
    ) {
      setAvailableSubjects((prev) => [...prev, trimmedSubject]);
      setFormData((prev) => ({
        ...prev,
        subjects: [...prev.subjects, trimmedSubject],
      }));
      setCustomSubject("");
    }
  };

  const handleRemoveSubject = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.filter((s) => s !== subject),
    }));
  };

  const handleBack = () => {
    router.back();
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
              <button
                onClick={handleBack}
                className={`flex items-center gap-2 mb-4 transition-colors duration-200 ${
                  isDarkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-800"
                }`}
                title={getTranslation("back", language) || "Back"}
              >
                <FaArrowLeft className="text-lg" />
                <span className="text-sm font-medium">
                  {getTranslation("back", language) || "Back"}
                </span>
              </button>
              <h1
                className={`text-3xl font-bold transition-colors duration-200 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {admission?._id
                  ? getTranslation("editAdmission", language) ||
                    "Edit Admission"
                  : getTranslation("addAdmission", language) || "Add Admission"}
              </h1>
              <p
                className={`text-sm mt-1 transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {admission?._id
                  ? getTranslation("updateAdmissionInfo", language) ||
                    "Update student admission information"
                  : getTranslation("fillAdmissionForm", language) ||
                    "Fill in the form below to create a new admission"}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 w-full">
            {/* Student Information Section */}
            <div
              className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-4 pb-2 border-b transition-colors duration-200 ${
                  isDarkMode
                    ? "text-gray-100 border-gray-700"
                    : "text-gray-900 border-gray-200"
                }`}
              >
                {getTranslation("studentInformation", language) ||
                  "Student Information"}
              </h2>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {getTranslation("studentName", language) || "Student Name"} *
                </label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  } ${errors.studentName ? "border-red-500" : ""}`}
                />
                {errors.studentName && (
                  <p
                    className={`text-sm mt-1 transition-colors duration-200 ${
                      isDarkMode ? "text-red-400" : "text-red-500"
                    }`}
                  >
                    {errors.studentName}
                  </p>
                )}
              </div>
            </div>

            {/* Parent & Contact Information Section */}
            <div
              className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-4 pb-2 border-b transition-colors duration-200 ${
                  isDarkMode
                    ? "text-gray-100 border-gray-700"
                    : "text-gray-900 border-gray-200"
                }`}
              >
                {getTranslation("parentInformation", language) ||
                  "Parent Information"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("fatherName", language) || "Father's Name"}{" "}
                    *
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) =>
                      setFormData({ ...formData, fatherName: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    } ${errors.fatherName ? "border-red-500" : ""}`}
                  />
                  {errors.fatherName && (
                    <p
                      className={`text-sm mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {errors.fatherName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("motherName", language) || "Mother's Name"}{" "}
                    *
                  </label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) =>
                      setFormData({ ...formData, motherName: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    } ${errors.motherName ? "border-red-500" : ""}`}
                  />
                  {errors.motherName && (
                    <p
                      className={`text-sm mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {errors.motherName}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("fatherMobile", language) ||
                      "Father's Mobile"}{" "}
                    *
                  </label>
                  <input
                    type="tel"
                    value={formData.fatherMobile}
                    onChange={(e) =>
                      setFormData({ ...formData, fatherMobile: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    } ${errors.fatherMobile ? "border-red-500" : ""}`}
                  />
                  {errors.fatherMobile && (
                    <p
                      className={`text-sm mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {errors.fatherMobile}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("motherMobile", language) ||
                      "Mother's Mobile"}
                  </label>
                  <input
                    type="tel"
                    value={formData.motherMobile}
                    onChange={(e) =>
                      setFormData({ ...formData, motherMobile: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("studentMobile", language) ||
                      "Student Mobile"}
                  </label>
                  <input
                    type="tel"
                    value={formData.studentMobile}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        studentMobile: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>

                {/* SMS Notification Targets */}
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("smsRecipients", language) ||
                      "SMS Notification Recipients"}
                  </label>
                  <div
                    className={`flex flex-wrap gap-4 p-3 rounded-lg transition-colors duration-200 ${
                      isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                    }`}
                  >
                    <label
                      className={`flex items-center gap-2 text-sm cursor-pointer transition-colors duration-200 ${
                        isDarkMode
                          ? "text-gray-300 hover:text-blue-400"
                          : "text-gray-700 hover:text-blue-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={alarmTargets.father}
                        onChange={(e) =>
                          setAlarmTargets((prev) => ({
                            ...prev,
                            father: e.target.checked,
                          }))
                        }
                        className={`rounded transition-colors duration-200 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      />
                      <span>
                        {getTranslation("fatherMobile", language) ||
                          "Father's Mobile"}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={alarmTargets.mother}
                        onChange={(e) =>
                          setAlarmTargets((prev) => ({
                            ...prev,
                            mother: e.target.checked,
                          }))
                        }
                        className={`rounded transition-colors duration-200 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      />
                      <span>
                        {getTranslation("motherMobile", language) ||
                          "Mother's Mobile"}
                      </span>
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      <input
                        type="checkbox"
                        checked={alarmTargets.student}
                        onChange={(e) =>
                          setAlarmTargets((prev) => ({
                            ...prev,
                            student: e.target.checked,
                          }))
                        }
                        className={`rounded transition-colors duration-200 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      />
                      <span>
                        {getTranslation("studentMobile", language) ||
                          "Student Mobile"}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {getTranslation("schoolName", language) || "School Name"} *
                </label>
                <input
                  type="text"
                  value={formData.schoolName}
                  onChange={(e) =>
                    setFormData({ ...formData, schoolName: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all ${
                    errors.schoolName
                      ? "border-red-500 dark:border-red-500"
                      : ""
                  }`}
                />
                {errors.schoolName && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {errors.schoolName}
                  </p>
                )}
              </div>
            </div>

            {/* Academic Information Section */}
            <div
              className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-4 pb-2 border-b transition-colors duration-200 ${
                  isDarkMode
                    ? "text-gray-100 border-gray-700"
                    : "text-gray-900 border-gray-200"
                }`}
              >
                {getTranslation("academicInformation", language) ||
                  "Academic Information"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("batchName", language) || "Batch Name"} *
                  </label>
                  <input
                    type="text"
                    value={formData.batchName}
                    onChange={(e) =>
                      setFormData({ ...formData, batchName: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    } ${errors.batchName ? "border-red-500" : ""}`}
                  />
                  {errors.batchName && (
                    <p
                      className={`text-sm mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {errors.batchName}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("batchTime", language) || "Batch Time"} *
                  </label>
                  <input
                    type="text"
                    placeholder={
                      getTranslation("batchTimePlaceholder", language) ||
                      "e.g., 9:00 AM - 11:00 AM"
                    }
                    value={formData.batchTime}
                    onChange={(e) =>
                      setFormData({ ...formData, batchTime: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    } ${errors.batchTime ? "border-red-500" : ""}`}
                  />
                  {errors.batchTime && (
                    <p
                      className={`text-sm mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {errors.batchTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Class Field */}
              <div className="mt-4">
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {getTranslation("class", language) || "Class"}
                </label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) =>
                    setFormData({ ...formData, class: e.target.value })
                  }
                  placeholder={
                    getTranslation("classPlaceholder", language) ||
                    "Enter student's class"
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                      : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>

              {/* Subjects Section */}
              <div className="mt-4">
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {getTranslation("subjects", language) || "Subjects"} *
                </label>

                {/* Selected Subjects Display */}
                {formData.subjects.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {formData.subjects.map((subject) => (
                        <span
                          key={subject}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-200 ${
                            isDarkMode
                              ? "bg-blue-900/50 text-blue-300 border border-blue-700"
                              : "bg-blue-100 text-blue-700 border border-blue-300"
                          }`}
                        >
                          {subject}
                          <button
                            type="button"
                            onClick={() => handleRemoveSubject(subject)}
                            className={`hover:opacity-70 transition-opacity ${
                              isDarkMode ? "text-blue-300" : "text-blue-700"
                            }`}
                            title={
                              getTranslation("remove", language) || "Remove"
                            }
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Subjects Grid */}
                <div
                  className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 rounded-lg transition-colors duration-200 mb-4 ${
                    isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                  }`}
                >
                  {availableSubjects.map((subject) => (
                    <label
                      key={subject}
                      className={`flex items-center gap-2 cursor-pointer p-2 rounded transition-colors duration-200 ${
                        formData.subjects.includes(subject)
                          ? isDarkMode
                            ? "bg-blue-900/30 border border-blue-700"
                            : "bg-blue-100 border border-blue-300"
                          : isDarkMode
                          ? "hover:bg-gray-600"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => handleSubjectToggle(subject)}
                        className={`rounded transition-colors duration-200 ${
                          isDarkMode ? "border-gray-600" : "border-gray-300"
                        }`}
                      />
                      <span
                        className={`text-sm transition-colors duration-200 ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {subject}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Add Custom Subject */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomSubject();
                      }
                    }}
                    placeholder={
                      getTranslation("addCustomSubject", language) ||
                      "Add custom subject name..."
                    }
                    className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                        : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSubject}
                    disabled={!customSubject.trim()}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                      customSubject.trim()
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : isDarkMode
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {getTranslation("add", language) || "Add"}
                  </button>
                </div>

                {errors.subjects && (
                  <p
                    className={`text-sm mt-2 transition-colors duration-200 ${
                      isDarkMode ? "text-red-400" : "text-red-500"
                    }`}
                  >
                    {errors.subjects}
                  </p>
                )}
              </div>

              {/* Admission Date and Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("admissionDate", language) ||
                      "Admission Date"}{" "}
                    *
                  </label>
                  <input
                    type="date"
                    value={formData.admissionDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        admissionDate: e.target.value,
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    } ${errors.admissionDate ? "border-red-500" : ""}`}
                  />
                  {errors.admissionDate && (
                    <p
                      className={`text-sm mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {errors.admissionDate}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {getTranslation("monthlyFee", language) || "Monthly Fee"} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.monthlyFee}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        monthlyFee: parseFloat(e.target.value) || 0,
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    } ${errors.monthlyFee ? "border-red-500" : ""}`}
                  />
                  {errors.monthlyFee && (
                    <p
                      className={`text-sm mt-1 transition-colors duration-200 ${
                        isDarkMode ? "text-red-400" : "text-red-500"
                      }`}
                    >
                      {errors.monthlyFee}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Information Section */}
            <div
              className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                isDarkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2
                className={`text-lg font-semibold mb-4 pb-2 border-b transition-colors duration-200 ${
                  isDarkMode
                    ? "text-gray-100 border-gray-700"
                    : "text-gray-900 border-gray-200"
                }`}
              >
                {getTranslation("additionalInformation", language) ||
                  "Additional Information"}
              </h2>
              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {getTranslation("notes", language) || "Notes"}
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                  placeholder={
                    getTranslation("notesPlaceholder", language) ||
                    "Add any additional notes or comments..."
                  }
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className={`w-full sm:w-auto px-6 py-3 border rounded-lg font-medium transition-colors duration-200 ${
                  isDarkMode
                    ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                    : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {getTranslation("cancel", language) || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {getTranslation("saving", language) || "Saving..."}
                  </span>
                ) : admission?._id ? (
                  getTranslation("update", language) || "Update"
                ) : (
                  getTranslation("create", language) || "Create"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
