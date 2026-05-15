"use client";

import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
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
}

interface AdmissionViewPageProps {
  admission: Admission;
}

const COACHING_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Coaching Center";
const COACHING_ADDRESS = "Dhaka, Bangladesh";
const COACHING_PHONE = "01XXXXXXXXX";
const COACHING_EMAIL = "info@coachingcenter.com";

export default function AdmissionViewPage({ admission }: AdmissionViewPageProps) {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();

  const statusColor =
    admission.status === "active"
      ? "bg-green-100 text-green-700 border-green-200"
      : admission.status === "inactive"
      ? "bg-yellow-100 text-yellow-700 border-yellow-200"
      : "bg-gray-100 text-gray-700 border-gray-200";

  const Row = ({ label, value }: { label: string; value?: string | number }) => (
    <div className="flex py-2 border-b border-gray-100 last:border-0 print:py-1.5">
      <span className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500 print:text-gray-600">
        {label}
      </span>
      <span className="text-sm text-gray-800 font-medium print:text-gray-900">
        {value || "—"}
      </span>
    </div>
  );

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className={`rounded-xl border p-5 mb-4 print:rounded-none print:border print:border-gray-300 print:p-4 print:mb-3 ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
      <h3 className={`text-sm font-bold uppercase tracking-widest mb-3 pb-2 border-b print:text-gray-700 print:border-gray-300 ${isDarkMode ? "text-blue-400 border-gray-700" : "text-blue-600 border-gray-200"}`}>
        {title}
      </h3>
      {children}
    </div>
  );

  return (
    <>
      {/* ── Screen toolbar (hidden on print) ─────────────────────── */}
      <div className={`print:hidden sticky top-0 z-10 px-6 py-3 flex items-center justify-between border-b shadow-sm ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
        <button
          onClick={() => router.back()}
          className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDarkMode ? "text-gray-400 hover:text-gray-100" : "text-gray-600 hover:text-gray-900"}`}
        >
          <FaArrowLeft className="w-3.5 h-3.5" />
          {language === "bn" ? "ফিরে যান" : "Back"}
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition-all"
        >
          <FaPrint className="w-3.5 h-3.5" />
          {language === "bn" ? "প্রিন্ট করুন" : "Print"}
        </button>
      </div>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className={`min-h-screen p-6 print:p-0 print:bg-white transition-colors ${isDarkMode ? "bg-gray-900" : "bg-slate-50"}`}>
        <div className="max-w-3xl mx-auto print:max-w-none">

          {/* ══ PRINT HEADER — Coaching Center Details ══════════════ */}
          <div className="hidden print:block mb-6 text-center border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-wide uppercase">
              {COACHING_NAME}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{COACHING_ADDRESS}</p>
            <p className="text-sm text-gray-600">
              Phone: {COACHING_PHONE} &nbsp;|&nbsp; Email: {COACHING_EMAIL}
            </p>
            <div className="mt-3 inline-block px-6 py-1 border border-gray-800 rounded text-sm font-bold uppercase tracking-widest text-gray-800">
              Student Admission Form
            </div>
          </div>

          {/* ── Screen heading ──────────────────────────────────────── */}
          <div className="print:hidden mb-6">
            <h1 className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
              {language === "bn" ? "ভর্তির বিবরণ" : "Admission Details"}
            </h1>
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {language === "bn" ? "সম্পূর্ণ ভর্তির তথ্য দেখুন" : "View complete admission information"}
            </p>
          </div>

          {/* ── Student ID + Status bar ──────────────────────────────── */}
          <div className={`flex items-center justify-between px-5 py-3 rounded-xl mb-4 print:rounded-none print:border print:border-gray-300 print:mb-3 ${isDarkMode ? "bg-gray-800" : "bg-white border border-gray-200"}`}>
            <div>
              <span className={`text-xs font-semibold uppercase tracking-widest ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                {language === "bn" ? "ছাত্র আইডি" : "Student ID"}
              </span>
              <p className={`text-lg font-bold mt-0.5 print:text-gray-900 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                {admission.studentId || "—"}
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border capitalize ${statusColor}`}>
              {admission.status}
            </span>
          </div>

          {/* ── Student Information ──────────────────────────────────── */}
          <Section title={language === "bn" ? "ছাত্রের তথ্য" : "Student Information"}>
            <Row label={language === "bn" ? "নাম" : "Student Name"} value={admission.studentName} />
            <Row label={language === "bn" ? "বিদ্যালয়" : "School / College"} value={admission.schoolName} />
            <Row label={language === "bn" ? "মোবাইল" : "Student Mobile"} value={admission.studentMobile} />
          </Section>

          {/* ── Parent Information ───────────────────────────────────── */}
          <Section title={language === "bn" ? "অভিভাবকের তথ্য" : "Parent Information"}>
            <div className="grid grid-cols-2 gap-x-6 print:gap-x-8">
              <div>
                <p className="text-xs font-bold uppercase text-blue-500 mb-2 print:text-blue-700">
                  {language === "bn" ? "পিতা" : "Father"}
                </p>
                <Row label={language === "bn" ? "নাম" : "Name"} value={admission.fatherName} />
                <Row label={language === "bn" ? "মোবাইল" : "Mobile"} value={admission.fatherMobile} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-pink-500 mb-2 print:text-pink-700">
                  {language === "bn" ? "মাতা" : "Mother"}
                </p>
                <Row label={language === "bn" ? "নাম" : "Name"} value={admission.motherName} />
                <Row label={language === "bn" ? "মোবাইল" : "Mobile"} value={admission.motherMobile} />
              </div>
            </div>
          </Section>

          {/* ── Academic Information ─────────────────────────────────── */}
          <Section title={language === "bn" ? "একাডেমিক তথ্য" : "Academic Information"}>
            <Row label={language === "bn" ? "শ্রেণি" : "Class"} value={admission.class} />
            <Row label={language === "bn" ? "ব্যাচ" : "Batch Name"} value={admission.batchName} />
            <Row label={language === "bn" ? "সময়" : "Batch Time"} value={admission.batchTime} />
            <div className="flex py-2 print:py-1.5">
              <span className="w-44 shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-500 print:text-gray-600">
                {language === "bn" ? "বিষয়সমূহ" : "Subjects"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {admission.subjects.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 text-xs rounded border bg-blue-50 border-blue-100 text-blue-700 print:bg-white print:border-gray-400 print:text-gray-800"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Section>

          {/* ── Admission & Fee ──────────────────────────────────────── */}
          <Section title={language === "bn" ? "ভর্তি ও ফি" : "Admission & Fee"}>
            <Row
              label={language === "bn" ? "ভর্তির তারিখ" : "Admission Date"}
              value={new Date(admission.admissionDate).toLocaleDateString(
                language === "bn" ? "bn-BD" : "en-GB",
                { year: "numeric", month: "long", day: "numeric" }
              )}
            />
            <Row
              label={language === "bn" ? "মাসিক ফি" : "Monthly Fee"}
              value={`৳ ${admission.monthlyFee.toLocaleString()}`}
            />
          </Section>

          {/* ── Notes ───────────────────────────────────────────────── */}
          {admission.notes && (
            <Section title={language === "bn" ? "নোট" : "Notes"}>
              <p className={`text-sm italic print:text-gray-700 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                {admission.notes}
              </p>
            </Section>
          )}

          {/* ══ PRINT FOOTER — Signatures ════════════════════════════ */}
          <div className="hidden print:flex justify-between mt-12 pt-6 border-t border-gray-300">
            <div className="text-center">
              <div className="w-40 border-t border-gray-700 mt-10 mx-auto" />
              <p className="text-xs text-gray-600 mt-1">Student Signature</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-gray-700 mt-10 mx-auto" />
              <p className="text-xs text-gray-600 mt-1">Parent Signature</p>
            </div>
            <div className="text-center">
              <div className="w-40 border-t border-gray-700 mt-10 mx-auto" />
              <p className="text-xs text-gray-600 mt-1">Director Signature</p>
            </div>
          </div>

          <div className="hidden print:block text-center mt-6 text-xs text-gray-400">
            Printed on {new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}
          </div>

        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 18mm 15mm 18mm 15mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          /* Hide everything except the print content */
          body > * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          /* Make the page container full-width */
          .max-w-3xl { max-width: 100% !important; }
          /* Ensure backgrounds print */
          * { -webkit-print-color-adjust: exact !important; }
        }
      `}</style>
    </>
  );
}
