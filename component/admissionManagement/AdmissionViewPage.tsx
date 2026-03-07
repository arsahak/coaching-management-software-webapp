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
        <div className="p-6 w-full mx-auto">
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
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg transition-all duration-200"
                title={getTranslation("print", language) || "Print"}
              >
                <FaPrint className="text-lg" />
                <span>{getTranslation("print", language) || "Print"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Main Detail Info */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Student Info */}
                <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-200 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                    <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDarkMode ? "text-blue-400" : "text-blue-700"}`}>
                       {getTranslation("studentInformation", language) || "Student Information"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {getTranslation("studentId", language) || "Student ID"}
                            </label>
                            <div className={`text-lg font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                                {admission.studentId || "N/A"}
                            </div>
                        </div>
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {getTranslation("studentName", language) || "Student Name"}
                            </label>
                            <div className={`text-lg font-medium ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                                {admission.studentName}
                            </div>
                        </div>
                        <div>
                            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {getTranslation("studentMobile", language) || "Student Mobile No."}
                            </label>
                            <div className={`text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {admission.studentMobile || "-"}
                            </div>
                        </div>
                        <div>
                             <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {getTranslation("schoolName", language) || "School Name"}
                            </label>
                            <div className={`text-base ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {admission.schoolName}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Parent Info */}
                <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-200 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                     <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDarkMode ? "text-pink-400" : "text-pink-600"}`}>
                       {getTranslation("parentInformation", language) || "Parent Information"}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Father */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50/80"}`}>
                            <h3 className={`text-sm font-bold uppercase mb-4 text-blue-500`}>
                               {getTranslation("father", language) || "Father"}
                            </h3>
                             <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs opacity-70 mb-1`}>{getTranslation("name", language) || "Name"}</label>
                                    <div className="font-medium">{admission.fatherName}</div>
                                </div>
                                <div>
                                    <label className={`block text-xs opacity-70 mb-1`}>{getTranslation("mobile", language) || "Mobile"}</label>
                                    <div className="font-medium">{admission.fatherMobile}</div>
                                </div>
                             </div>
                        </div>

                        {/* Mother */}
                        <div className={`p-4 rounded-lg ${isDarkMode ? "bg-gray-700/50" : "bg-gray-50/80"}`}>
                             <h3 className={`text-sm font-bold uppercase mb-4 text-pink-500`}>
                               {getTranslation("mother", language) || "Mother"}
                            </h3>
                             <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs opacity-70 mb-1`}>{getTranslation("name", language) || "Name"}</label>
                                    <div className="font-medium">{admission.motherName}</div>
                                </div>
                                <div>
                                    <label className={`block text-xs opacity-70 mb-1`}>{getTranslation("mobile", language) || "Mobile"}</label>
                                    <div className="font-medium">{admission.motherMobile || "-"}</div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Academic - Subjects */}
                <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-200 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                    <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? "text-gray-100" : "text-gray-800"}`}>
                       {getTranslation("subjects", language) || "Subjects"}
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {admission.subjects.map((subject, idx) => (
                            <span key={idx} className={`px-3 py-1 rounded-full text-sm border ${
                                isDarkMode ? "bg-blue-900/20 border-blue-800 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-700"
                            }`}>
                                {subject}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Sidebar Info */}
             <div className="lg:col-span-1 space-y-6">
                
                {/* Status & Key Info */}
                <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-200 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                     <div className="mb-6">
                        <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                            {getTranslation("status", language) || "Status"}
                        </label>
                        <span
                            className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold capitalize ${
                            admission.status === "active"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : admission.status === "inactive"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                                : "bg-gray-100 text-gray-700 border border-gray-200"
                            }`}
                        >
                            {admission.status === "active"
                              ? getTranslation("active", language) || "Active"
                              : admission.status === "inactive"
                              ? getTranslation("inactive", language) || "Inactive"
                              : getTranslation("completed", language) || "Completed"}
                        </span>
                     </div>

                     <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                        <div>
                             <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {getTranslation("class", language) || "Class"}
                            </label>
                            <div className="text-lg font-medium">{admission.class}</div>
                        </div>
                        <div>
                             <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                {getTranslation("admissionDate", language) || "Admission Date"}
                            </label>
                            <div className="text-base">
                                {new Date(admission.admissionDate).toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
                                    year: "numeric", month: "long", day: "numeric"
                                })}
                            </div>
                        </div>
                     </div>
                </div>

                {/* Batch & Stats */}
                <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-200 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                    <h3 className={`text-md font-bold mb-4 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
                        {getTranslation("batchInformation", language) || "Batch Info"}
                    </h3>
                    <div className="space-y-4">
                         <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-gray-700/30 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                             <div className="text-xs text-gray-500 mb-1">{getTranslation("batchName", language) || "Batch Name"}</div>
                             <div className="font-medium">{admission.batchName}</div>
                         </div>
                         <div className={`p-3 rounded-lg border ${isDarkMode ? "bg-gray-700/30 border-gray-700" : "bg-gray-50 border-gray-100"}`}>
                             <div className="text-xs text-gray-500 mb-1">{getTranslation("batchTime", language) || "Time"}</div>
                             <div className="font-medium">{admission.batchTime}</div>
                         </div>
                    </div>
                </div>

                {/* Fees */}
                <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-200 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                     <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {getTranslation("monthlyFee", language) || "Monthly Fee"}
                    </label>
                    <div className={`text-3xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                         ৳{admission.monthlyFee.toLocaleString()}
                    </div>
                </div>

                {/* Extra Info */}
                 {(admission.notes || (admission.alarmMobile && admission.alarmMobile.length > 0)) && (
                    <div className={`p-6 rounded-xl shadow-sm border transition-colors duration-200 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        {admission.alarmMobile && admission.alarmMobile.length > 0 && (
                            <div className="mb-6">
                                <label className={`block text-xs font-semibold uppercase tracking-wider mb-3 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                    {getTranslation("smsRecipients", language) || "SMS Recipients"}
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {admission.alarmMobile.map((mobile, index) => (
                                        <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded border border-green-200">
                                            {mobile}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {admission.notes && (
                             <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                                    {getTranslation("notes", language) || "Notes"}
                                </label>
                                <p className={`text-sm italic p-3 rounded-lg border ${isDarkMode ? "bg-gray-700/30 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-100 text-gray-600"}`}>
                                    "{admission.notes}"
                                </p>
                            </div>
                        )}
                    </div>
                 )}

             </div>

          </div>
        </div>
      </div>
      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; }
          .print-content button { display: none; }
        }
      `}</style>
    </>
  );
}
