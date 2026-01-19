"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { getTranslation } from "@/lib/translations";
import { useRouter } from "next/navigation";
import { FaArrowLeft, FaPrint } from "react-icons/fa";

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

interface AdmissionViewPageProps {
  admission: Admission;
}

export default function AdmissionViewPage({
  admission,
}: AdmissionViewPageProps) {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <div
        className={`min-h-screen transition-colors duration-200 print-content ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="p-6">
          {/* Header Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 print:hidden">
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
                {getTranslation("admissionDetails", language) ||
                  "Admission Details"}
              </h1>
              <p
                className={`text-sm mt-1 transition-colors duration-200 ${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                }`}
              >
                {getTranslation("viewAdmissionInfo", language) ||
                  "View complete admission information"}
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                title={getTranslation("print", language) || "Print"}
              >
                <FaPrint className="text-lg" />
                <span>{getTranslation("print", language) || "Print"}</span>
              </button>
            </div>
          </div>

          <div className="space-y-6 w-full">
            {/* Student Information Card */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("studentId", language) || "Student ID"}
                  </label>
                  <p
                    className={`text-lg font-semibold transition-colors duration-200 ${
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
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("studentName", language) || "Student Name"}
                  </label>
                  <p
                    className={`text-lg font-semibold transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.studentName}
                  </p>
                </div>
              </div>
            </div>

            {/* Parent Information Card */}
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
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("fatherName", language) || "Father's Name"}
                  </label>
                  <p
                    className={`text-base font-medium transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.fatherName}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("motherName", language) || "Mother's Name"}
                  </label>
                  <p
                    className={`text-base font-medium transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.motherName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("fatherMobile", language) ||
                      "Father's Mobile"}
                  </label>
                  <p
                    className={`text-base transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.fatherMobile}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("motherMobile", language) ||
                      "Mother's Mobile"}
                  </label>
                  <p
                    className={`text-base transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.motherMobile || (
                      <span
                        className={`transition-colors duration-200 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        -
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("studentMobile", language) ||
                      "Student Mobile"}
                  </label>
                  <p
                    className={`text-base transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.studentMobile || (
                      <span
                        className={`transition-colors duration-200 ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        -
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Academic Information Card */}
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
              <div className="mb-4">
                <label
                  className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {getTranslation("schoolName", language) || "School Name"}
                </label>
                <p
                  className={`text-base font-medium transition-colors duration-200 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {admission.schoolName}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("class", language) || "Class"}
                  </label>
                  <p
                    className={`text-base font-medium transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.class}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("status", language) || "Status"}
                  </label>
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
                      ? getTranslation("inactive", language) || "Inactive"
                      : getTranslation("completed", language) || "Completed"}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <label
                  className={`block text-xs font-medium mb-2 uppercase tracking-wide transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {getTranslation("subjects", language) || "Subjects"}
                </label>
                <div className="flex flex-wrap gap-2">
                  {admission.subjects.map((subject, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        isDarkMode
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Batch Information Card */}
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
                {getTranslation("batchInformation", language) ||
                  "Batch Information"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("batchName", language) || "Batch Name"}
                  </label>
                  <p
                    className={`text-base font-medium transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.batchName}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("batchTime", language) || "Batch Time"}
                  </label>
                  <p
                    className={`text-base font-medium transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {admission.batchTime}
                  </p>
                </div>
              </div>

              {/* Admission Date and Fee */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("admissionDate", language) ||
                      "Admission Date"}
                  </label>
                  <p
                    className={`text-base font-medium transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {new Date(admission.admissionDate).toLocaleDateString(
                      language === "bn" ? "bn-BD" : "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </p>
                </div>
                <div>
                  <label
                    className={`block text-xs font-medium mb-1 uppercase tracking-wide transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {getTranslation("monthlyFee", language) || "Monthly Fee"}
                  </label>
                  <p
                    className={`text-xl font-bold transition-colors duration-200 ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    ৳{admission.monthlyFee.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Information Card */}
            {((admission.alarmMobile && admission.alarmMobile.length > 0) || admission.notes) && (
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
                {admission.alarmMobile && admission.alarmMobile.length > 0 && (
                  <div className="mb-4">
                    <label
                      className={`block text-xs font-medium mb-2 uppercase tracking-wide transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {getTranslation("smsRecipients", language) ||
                        "SMS Notification Recipients"}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {admission.alarmMobile.map((mobile, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                            isDarkMode
                              ? "bg-green-900/30 text-green-400"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {mobile}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {admission.notes && (
                  <div>
                    <label
                      className={`block text-xs font-medium mb-2 uppercase tracking-wide transition-colors duration-200 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {getTranslation("notes", language) || "Notes"}
                    </label>
                    <div
                      className={`p-4 rounded-lg transition-colors duration-200 ${
                        isDarkMode ? "bg-gray-700/50" : "bg-gray-50"
                      }`}
                    >
                      <p
                        className={`text-sm whitespace-pre-wrap leading-relaxed transition-colors duration-200 ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {admission.notes}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content,
          .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-content button {
            display: none;
          }
        }
      `}</style>
    </>
  );
}
