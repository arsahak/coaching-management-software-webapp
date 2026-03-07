"use client";

import { createAdmission, updateAdmission } from "@/app/actions/admission";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import {
  getPhoneErrorMessage,
  isPositiveNumber,
  validatePhoneNumber,
} from "@/lib/validation";
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

const PREDEFINED_CLASSES = [
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11",
  "Class 12",
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
    class: admission?.class || "", // Required field
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
  const [customClass, setCustomClass] = useState("");
  const [isCustomClass, setIsCustomClass] = useState(() => {
    // Check if existing class is not in predefined list
    return !!admission?.class && !PREDEFINED_CLASSES.includes(admission.class);
  });
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

    // Student name validation
    if (!formData.studentName.trim()) {
      newErrors.studentName =
        getTranslation("required", language) || "Required";
    }

    // Father name validation
    if (!formData.fatherName.trim()) {
      newErrors.fatherName = getTranslation("required", language) || "Required";
    }

    // Mother name validation
    if (!formData.motherName.trim()) {
      newErrors.motherName = getTranslation("required", language) || "Required";
    }

    // School name validation
    if (!formData.schoolName.trim()) {
      newErrors.schoolName = getTranslation("required", language) || "Required";
    }

    // Father mobile validation
    if (!formData.fatherMobile.trim()) {
      newErrors.fatherMobile =
        getTranslation("required", language) || "Required";
    } else if (!validatePhoneNumber(formData.fatherMobile)) {
      newErrors.fatherMobile = getPhoneErrorMessage(language);
    }

    // Mother mobile validation (optional)
    if (
      formData.motherMobile?.trim() &&
      !validatePhoneNumber(formData.motherMobile)
    ) {
      newErrors.motherMobile = getPhoneErrorMessage(language);
    }

    // Student mobile validation (optional)
    if (
      formData.studentMobile?.trim() &&
      !validatePhoneNumber(formData.studentMobile)
    ) {
      newErrors.studentMobile = getPhoneErrorMessage(language);
    }

    // Class validation
    if (!formData.class.trim()) {
      newErrors.class = getTranslation("required", language) || "Required";
    }

    // Subjects validation
    if (formData.subjects.length === 0) {
      newErrors.subjects =
        getTranslation("atLeastOneSubject", language) ||
        "At least one subject is required";
    }

    // Batch name validation
    if (!formData.batchName.trim()) {
      newErrors.batchName = getTranslation("required", language) || "Required";
    }

    // Batch time validation
    if (!formData.batchTime.trim()) {
      newErrors.batchTime = getTranslation("required", language) || "Required";
    }

    // Admission date validation
    if (!formData.admissionDate) {
      newErrors.admissionDate =
        getTranslation("required", language) || "Required";
    }

    // Monthly fee validation
    if (!isPositiveNumber(formData.monthlyFee)) {
      newErrors.monthlyFee =
        getTranslation("invalidAmount", language) ||
        "Please enter a valid amount";
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

        // Redirect to admission main page
        router.push("/admission");
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
        <div className="p-4 md:p-6 w-full mx-auto">
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

            {/* Top Actions (Desktop) */}
            <div className="hidden lg:flex gap-3 mt-4 lg:mt-0">
               <button
                type="button"
                onClick={handleBack}
                className={`px-6 py-2.5 border rounded-lg font-medium transition-colors duration-200 ${
                  isDarkMode
                    ? "border-gray-600 hover:bg-gray-700 text-gray-300"
                    : "border-gray-300 hover:bg-gray-50 text-gray-700"
                }`}
              >
                {getTranslation("cancel", language) || "Cancel"}
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                 {isPending ? (
                    <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>{getTranslation("saving", language) || "Saving..."}</span>
                    </>
                 ) : (
                    <>
                     {admission?._id
                      ? getTranslation("update", language) || "Update"
                      : getTranslation("create", language) || "Create Admission"}
                    </>
                 )}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Column: Personal & Academic Info */}
              <div className="lg:col-span-8 space-y-6">

                {/* 1. Student Information */}
                <div
                  className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h2
                    className={`text-lg font-semibold mb-6 flex items-center gap-2 pb-2 border-b transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-100 border-gray-700"
                        : "text-gray-900 border-gray-200"
                    }`}
                  >
                     <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">1</span>
                    {getTranslation("studentInformation", language) ||
                      "Student Information"}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {getTranslation("studentName", language) || "Student Name"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.studentName}
                          onChange={(e) =>
                            setFormData({ ...formData, studentName: e.target.value })
                          }
                          placeholder={getTranslation("studentNamePlaceholder", language) || "Enter student's full name"}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                              : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                          } ${errors.studentName ? "border-red-500" : ""}`}
                        />
                        {errors.studentName && (
                          <p className={`text-sm mt-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                            {errors.studentName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {getTranslation("schoolName", language) || "School Name"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.schoolName}
                          onChange={(e) =>
                            setFormData({ ...formData, schoolName: e.target.value })
                          }
                          placeholder={getTranslation("schoolNamePlaceholder", language) || "Current school or college"}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                              : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                          } ${errors.schoolName ? "border-red-500" : ""}`}
                        />
                        {errors.schoolName && (
                          <p className={`text-sm mt-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                            {errors.schoolName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {getTranslation("studentMobile", language) || "Student Mobile No."}
                        </label>
                        <input
                          type="tel"
                          value={formData.studentMobile}
                          onChange={(e) =>
                            setFormData({ ...formData, studentMobile: e.target.value })
                          }
                          placeholder={getTranslation("studentMobilePlaceholder", language) || "Enter student's mobile number"}
                          className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                            isDarkMode
                              ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500"
                              : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                          } ${errors.studentMobile ? "border-red-500" : ""}`}
                        />
                        {errors.studentMobile && (
                          <p className={`text-sm mt-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>
                            {errors.studentMobile}
                          </p>
                        )}
                      </div>
                  </div>
                </div>

                {/* 2. Parent Information */}
                <div
                  className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h2
                    className={`text-lg font-semibold mb-6 flex items-center gap-2 pb-2 border-b transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-100 border-gray-700"
                        : "text-gray-900 border-gray-200"
                    }`}
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">2</span>
                    {getTranslation("parentInformation", language) || "Parent Information"}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Father */}
                    <div className={`p-4 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-700/30" : "border-gray-100 bg-gray-50"}`}>
                        <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>
                           {getTranslation("father", language) || "Father"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode?"text-gray-300":"text-gray-700"}`}>
                                   Father's Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.fatherName}
                                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                    placeholder={getTranslation("fatherNamePlaceholder", language) || "Enter father's name"}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        isDarkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                                    } ${errors.fatherName ? "border-red-500" : ""}`}
                                />
                                {errors.fatherName && <p className={`text-sm mt-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>{errors.fatherName}</p>}
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode?"text-gray-300":"text-gray-700"}`}>
                                   Father's Mobile No. <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={formData.fatherMobile}
                                    onChange={(e) => setFormData({ ...formData, fatherMobile: e.target.value })}
                                    placeholder={getTranslation("mobilePlaceholder", language) || "01XXXXXXXXX"}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        isDarkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                                    } ${errors.fatherMobile ? "border-red-500" : ""}`}
                                />
                                {errors.fatherMobile && <p className={`text-sm mt-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>{errors.fatherMobile}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Mother */}
                    <div className={`p-4 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-700/30" : "border-gray-100 bg-gray-50"}`}>
                        <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${isDarkMode ? "text-pink-400" : "text-pink-600"}`}>
                           {getTranslation("mother", language) || "Mother"}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode?"text-gray-300":"text-gray-700"}`}>
                                   Mother's Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.motherName}
                                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                                    placeholder={getTranslation("motherNamePlaceholder", language) || "Enter mother's name"}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        isDarkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                                    } ${errors.motherName ? "border-red-500" : ""}`}
                                />
                                {errors.motherName && <p className={`text-sm mt-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>{errors.motherName}</p>}
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDarkMode?"text-gray-300":"text-gray-700"}`}>
                                   Mother's Mobile No.
                                </label>
                                <input
                                    type="tel"
                                    value={formData.motherMobile}
                                    onChange={(e) => setFormData({ ...formData, motherMobile: e.target.value })}
                                    placeholder={getTranslation("mobilePlaceholder", language) || "01XXXXXXXXX"}
                                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        isDarkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                                    } ${errors.motherMobile ? "border-red-500" : ""}`}
                                />
                                {errors.motherMobile && <p className={`text-sm mt-1 ${isDarkMode ? "text-red-400" : "text-red-500"}`}>{errors.motherMobile}</p>}
                            </div>
                        </div>
                    </div>
                  </div>
                </div>

                {/* 3. Academic Information */}
                <div
                  className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h2
                    className={`text-lg font-semibold mb-6 flex items-center gap-2 pb-2 border-b transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-100 border-gray-700"
                        : "text-gray-900 border-gray-200"
                    }`}
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">3</span>
                    {getTranslation("academicInformation", language) || "Academic Information"}
                  </h2>

                   {/* Class Selection */}
                   <div className="mb-6">
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                         {getTranslation("class", language) || "Class/Grade"} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={isCustomClass ? "custom" : formData.class}
                        onChange={(e) => {
                          if (e.target.value === "custom") {
                            setIsCustomClass(true);
                            setFormData({ ...formData, class: customClass });
                          } else {
                            setIsCustomClass(false);
                            setFormData({ ...formData, class: e.target.value });
                          }
                        }}
                        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                        } ${errors.class ? "border-red-500" : ""}`}
                      >
                        <option value="">{getTranslation("selectClass", language) || "Select Class/Grade"}</option>
                        {PREDEFINED_CLASSES.map((cls) => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                        <option value="custom">{getTranslation("other", language) || "➕ Custom Class"}</option>
                      </select>

                      {isCustomClass && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={customClass}
                              placeholder={getTranslation("enterCustomClass", language) || "e.g., A-Level, HSC 1st Year"}
                              onChange={(e) => {
                                setCustomClass(e.target.value);
                                setFormData({ ...formData, class: e.target.value });
                              }}
                              className={`w-full px-4 py-2.5 border rounded-lg ${
                                isDarkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                              }`}
                            />
                          </div>
                      )}
                      {errors.class && <p className="text-red-500 text-sm mt-1">{errors.class}</p>}
                   </div>

                   {/* Batch Info */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {getTranslation("batchName", language) || "Batch Name"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.batchName}
                          onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
                          placeholder={getTranslation("batchNamePlaceholder", language) || "e.g., Morning Batch A"}
                          className={`w-full px-4 py-2.5 border rounded-lg ${
                            isDarkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                          } ${errors.batchName ? "border-red-500" : ""}`}
                        />
                        {errors.batchName && <p className="text-red-500 text-sm mt-1">{errors.batchName}</p>}
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {getTranslation("batchTime", language) || "Batch Time"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.batchTime}
                          placeholder={getTranslation("batchTimePlaceholder", language) || "e.g., 9:00 AM - 11:00 AM"}
                          onChange={(e) => setFormData({ ...formData, batchTime: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-lg ${
                            isDarkMode ? "border-gray-600 bg-gray-700 text-white placeholder-gray-500" : "border-gray-300 bg-white text-gray-900 placeholder-gray-400"
                          } ${errors.batchTime ? "border-red-500" : ""}`}
                        />
                         {errors.batchTime && <p className="text-red-500 text-sm mt-1">{errors.batchTime}</p>}
                      </div>
                   </div>

                   {/* Subjects */}
                   <div>
                      <div className="flex justify-between items-center mb-3">
                         <label className={`block text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {getTranslation("subjects", language) || "Subjects"} <span className="text-red-500">*</span>
                         </label>
                         <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {formData.subjects.length} {getTranslation("selected", language) || "selected"}
                         </span>
                      </div>

                      {/* Selected Tags */}
                      {formData.subjects.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {formData.subjects.map((subject) => (
                              <span
                                key={subject}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                                  isDarkMode
                                    ? "bg-blue-900/50 text-blue-300 border border-blue-700"
                                    : "bg-blue-100 text-blue-700 border border-blue-300"
                                }`}
                              >
                                {subject}
                                <button type="button" onClick={() => handleRemoveSubject(subject)} className="hover:text-red-500">
                                   ×
                                </button>
                              </span>
                            ))}
                          </div>
                      )}

                      {/* Subject Grid */}
                      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-4 p-4 rounded-lg border ${
                          isDarkMode ? "bg-gray-700/30 border-gray-600" : "bg-gray-50 border-gray-200"
                      }`}>
                         {availableSubjects.map((subject) => (
                            <label key={subject} className="flex items-center gap-2 cursor-pointer">
                               <input
                                  type="checkbox"
                                  checked={formData.subjects.includes(subject)}
                                  onChange={() => handleSubjectToggle(subject)}
                                  className={`rounded ${isDarkMode ? "bg-gray-700 border-gray-500" : ""}`}
                               />
                               <span className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{subject}</span>
                            </label>
                         ))}
                      </div>

                      {/* Custom Subject */}
                      <div className="flex gap-2">
                         <input
                            type="text"
                            value={customSubject}
                            onChange={(e) => setCustomSubject(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') { e.preventDefault(); handleAddCustomSubject(); }
                            }}
                             placeholder={getTranslation("addCustomSubject", language) || "Add custom subject..."}
                             className={`flex-1 px-4 py-2 border rounded-lg ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"}`}
                          />
                          <button
                              type="button"
                              onClick={handleAddCustomSubject}
                              disabled={!customSubject.trim()}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 hover:bg-blue-700"
                          >
                              {getTranslation("add", language) || "Add"}
                          </button>
                      </div>
                      {errors.subjects && <p className="text-red-500 text-sm mt-2">{errors.subjects}</p>}
                   </div>
                </div>

              </div>

              {/* Right Column: Admission & Settings */}
              <div className="lg:col-span-4 space-y-6">

                 {/* 4. Admission Details */}
                 <div
                  className={`p-6 rounded-xl shadow-md transition-colors duration-200 sticky top-4 ${
                    isDarkMode ? "bg-gray-800" : "bg-white"
                  }`}
                >
                  <h2
                    className={`text-lg font-semibold mb-6 flex items-center gap-2 pb-2 border-b transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-100 border-gray-700"
                        : "text-gray-900 border-gray-200"
                    }`}
                  >
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 text-sm">4</span>
                    {getTranslation("admissionDetails", language) || "Admission Details"}
                  </h2>

                  <div className="space-y-4">
                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {getTranslation("admissionDate", language) || "Admission Date"} <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={formData.admissionDate}
                          onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                          className={`w-full px-4 py-2.5 border rounded-lg ${
                            isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "border-gray-300 bg-white text-gray-900"
                          } ${errors.admissionDate ? "border-red-500" : ""}`}
                        />
                        {errors.admissionDate && <p className="text-red-500 text-sm mt-1">{errors.admissionDate}</p>}
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-1.5 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                          {getTranslation("monthlyFee", language) || "Monthly Fee"} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>৳</span>
                            <input
                              type="number"
                              min="0"
                              value={formData.monthlyFee}
                              onChange={(e) => setFormData({ ...formData, monthlyFee: parseFloat(e.target.value) || 0 })}
                              className={`w-full pl-8 pr-4 py-2.5 border rounded-lg ${
                                isDarkMode ? "border-gray-600 bg-gray-700 text-white" : "bg-white border-gray-300 bg-white text-gray-900"
                              } ${errors.monthlyFee ? "border-red-500" : ""}`}
                            />
                        </div>
                         {errors.monthlyFee && <p className="text-red-500 text-sm mt-1">{errors.monthlyFee}</p>}
                      </div>

                       <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                             {getTranslation("smsRecipients", language) || "SMS Notifications"}
                             <span className="text-xs font-normal text-gray-500 ml-1">({getTranslation("whoReceivesUpdates", language) || "Who receives updates?"})</span>
                          </label>
                          <div className="space-y-2">
                              {[
                                  { key: 'father', label: getTranslation("father", language) || 'Father', mobile: formData.fatherMobile },
                                  { key: 'mother', label: getTranslation("mother", language) || 'Mother', mobile: formData.motherMobile },
                                  { key: 'student', label: getTranslation("student", language) || 'Student', mobile: formData.studentMobile }
                              ].map((target) => (
                                  <label key={target.key} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                                      (alarmTargets as any)[target.key]
                                         ? isDarkMode ? "bg-blue-900/30 border-blue-700" : "bg-blue-50 border-blue-300"
                                         : isDarkMode ? "bg-gray-700 border-gray-600 opacity-70" : "bg-gray-50 border-gray-200"
                                  }`}>
                                      <div className="flex items-center gap-3">
                                          <input
                                             type="checkbox"
                                             checked={(alarmTargets as any)[target.key]}
                                             onChange={(e) => setAlarmTargets(prev => ({ ...prev, [target.key]: e.target.checked }))}
                                             disabled={!target.mobile}
                                             className="rounded"
                                          />
                                          <div>
                                              <span className={`block text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{target.label}</span>
                                              <span className="text-xs text-gray-500">{target.mobile || getTranslation("noMobile", language) || "No Mobile"}</span>
                                          </div>
                                      </div>
                                  </label>
                              ))}
                          </div>
                       </div>

                       <div className="pt-4">
                          <label className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {getTranslation("notes", language) || "Notes"}
                          </label>
                          <textarea
                             rows={3}
                             value={formData.notes}
                             onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                             placeholder={getTranslation("notesPlaceholder", language) || "Any additional info..."}
                             className={`w-full px-4 py-2 border rounded-lg resize-none ${
                                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300"
                             }`}
                          />
                      </div>

                       <div className="pt-4 flex lg:hidden flex-col gap-3">
                            <button
                                onClick={handleSubmit}
                                disabled={isPending}
                                className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700"
                            >
                                {isPending ? (
                                    getTranslation("saving", language) || "Saving..."
                                ) : (
                                    admission?._id 
                                        ? getTranslation("update", language) || "Update"
                                        : getTranslation("create", language) || "Create Admission"
                                )}
                            </button>
                            <button onClick={handleBack} className="w-full py-3 text-gray-500 font-medium">
                                {getTranslation("cancel", language) || "Cancel"}
                            </button>
                       </div>
                  </div>
                </div>
              </div>

            </div>
          </form>
        </div>
      </div>
    </>
  );
}
