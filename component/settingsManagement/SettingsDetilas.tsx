"use client";

import { getSMSSettings, saveSMSSettings } from "@/app/actions/smsSettings";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FaBell,
  FaBullhorn,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGraduationCap,
  FaInfoCircle,
  FaMoneyBillWave,
  FaSave,
  FaSms,
  FaSpinner,
  FaUserPlus,
  FaUserCheck,
  FaUserTimes,
} from "react-icons/fa";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SMSSetting {
  enabled: boolean;
  message: string;
}

interface Settings {
  admission:           SMSSetting;
  attendancePresent:   SMSSetting;
  attendanceAbsent:    SMSSetting;
  examScheduled:       SMSSetting;
  examResult:          SMSSetting;
  examAlert:           SMSSetting;
  feePaid:             SMSSetting;
  feeReminder:         SMSSetting;
  feeOverdue:          SMSSetting;
}

// ─── Default message templates ────────────────────────────────────────────────

const DEFAULTS: Settings = {
  admission: {
    enabled: true,
    message:
      "Dear Parent, {studentName} (ID: {studentId}) has been successfully admitted to {class} — {batch}. Welcome to our coaching center! Date: {date}.",
  },
  attendancePresent: {
    enabled: false,
    message:
      "Dear Parent, {studentName} was PRESENT in today's class ({date}). Class: {class} | Batch: {batch}.",
  },
  attendanceAbsent: {
    enabled: true,
    message:
      "Dear Parent, {studentName} was ABSENT from today's class ({date}). Class: {class} | Batch: {batch}. Please ensure regular attendance.",
  },
  examScheduled: {
    enabled: true,
    message:
      "Dear Parent, {studentName}'s exam has been scheduled. Exam: {examName} | Subject: {subject} | Date: {examDate} | Time: {examTime}. Class: {class} | Batch: {batch}.",
  },
  examResult: {
    enabled: true,
    message:
      "Dear Parent, {studentName}'s exam result — Subject: {subject}, Marks: {marks}/{totalMarks}, Grade: {grade}. Class: {class} | Date: {date}.",
  },
  examAlert: {
    enabled: true,
    message:
      "Dear Parent, important notice for {studentName} ({class} | {batch}): {alertMessage}",
  },
  feePaid: {
    enabled: true,
    message:
      "Dear Parent, payment of ৳{amount} received for {studentName} ({class}). Month: {month} {year}. Payment method: {paymentMethod}. Thank you!",
  },
  feeReminder: {
    enabled: true,
    message:
      "Dear Parent, this is a reminder that ৳{amount} fee is due for {studentName} ({class}) for {month} {year}. Due date: {dueDate}. Please pay on time.",
  },
  feeOverdue: {
    enabled: true,
    message:
      "Dear Parent, the fee of ৳{amount} for {studentName} ({class}) for {month} {year} is OVERDUE since {dueDate}. Please pay immediately to avoid issues.",
  },
};

// ─── Variable sets per category ───────────────────────────────────────────────

const VARS = {
  common:       ["{studentName}", "{studentId}", "{class}", "{batch}", "{date}"],
  fee:          ["{amount}", "{dueDate}", "{month}", "{year}", "{paymentMethod}"],
  examSchedule: ["{examName}", "{subject}", "{examDate}", "{examTime}"],
  examResult:   ["{subject}", "{marks}", "{totalMarks}", "{grade}"],
  examAlert:    ["{examName}", "{subject}", "{examDate}", "{examTime}", "{alertMessage}"],
};

// ─── Tab config ───────────────────────────────────────────────────────────────

type Tab = "admission" | "attendance" | "exam" | "fee";

const TABS: { id: Tab; labelEn: string; labelBn: string; icon: React.ReactNode }[] = [
  { id: "admission",  labelEn: "Admission",  labelBn: "ভর্তি",       icon: <FaUserPlus /> },
  { id: "attendance", labelEn: "Attendance", labelBn: "উপস্থিতি",    icon: <FaUserCheck /> },
  { id: "exam",       labelEn: "Exam",       labelBn: "পরীক্ষা",     icon: <FaGraduationCap /> },
  { id: "fee",        labelEn: "Fee",        labelBn: "ফি",           icon: <FaMoneyBillWave /> },
];

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        enabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── SMS Setting Card ─────────────────────────────────────────────────────────

interface CardProps {
  icon:        React.ReactNode;
  iconColor:   string;
  bgColor:     string;
  title:       string;
  description: string;
  trigger:     string;
  setting:     SMSSetting;
  variables:   string[];
  isDarkMode:  boolean;
  onChange:    (s: SMSSetting) => void;
}

function SMSSettingCard({
  icon, iconColor, bgColor, title, description, trigger,
  setting, variables, isDarkMode, onChange,
}: CardProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVar = (v: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? ta.value.length;
    const end   = ta.selectionEnd   ?? ta.value.length;
    const next  = ta.value.slice(0, start) + v + ta.value.slice(end);
    onChange({ ...setting, message: next });
    // restore cursor after inserted text
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + v.length, start + v.length);
    }, 0);
  };

  const charCount = setting.message.length;
  const smsPages  = Math.ceil(charCount / 160) || 1;

  return (
    <div className={`rounded-xl border transition-all duration-200 ${
      isDarkMode
        ? "bg-gray-800 border-gray-700"
        : "bg-white border-gray-200 shadow-sm"
    }`}>
      {/* Card header */}
      <div className={`flex items-start justify-between gap-4 p-5 border-b ${
        isDarkMode ? "border-gray-700" : "border-gray-100"
      }`}>
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}>
            <span className={`text-base ${iconColor}`}>{icon}</span>
          </div>
          <div>
            <h3 className={`font-semibold text-sm ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
              {title}
            </h3>
            <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {description}
            </p>
            <span className={`inline-flex items-center gap-1 mt-1.5 text-xs px-2 py-0.5 rounded-full font-medium ${
              isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
            }`}>
              <FaInfoCircle className="text-xs" /> {trigger}
            </span>
          </div>
        </div>

        {/* Auto-send toggle */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Toggle enabled={setting.enabled} onChange={(v) => onChange({ ...setting, enabled: v })} />
          <span className={`text-xs font-medium ${
            setting.enabled
              ? isDarkMode ? "text-blue-400" : "text-blue-600"
              : isDarkMode ? "text-gray-500" : "text-gray-400"
          }`}>
            {setting.enabled ? "Auto ON" : "Auto OFF"}
          </span>
        </div>
      </div>

      {/* Message editor */}
      <div className="p-5 space-y-3">
        {/* Variable chips */}
        <div className="flex flex-wrap gap-1.5">
          {variables.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => insertVar(v)}
              className={`text-xs px-2.5 py-1 rounded-full font-mono border transition-colors ${
                isDarkMode
                  ? "border-blue-700 bg-blue-900/20 text-blue-300 hover:bg-blue-900/40"
                  : "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
              title={`Click to insert ${v}`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={setting.message}
          onChange={(e) => onChange({ ...setting, message: e.target.value })}
          rows={4}
          placeholder="Type your message here..."
          className={`w-full px-3 py-2.5 text-sm rounded-lg border resize-none font-mono leading-relaxed focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            isDarkMode
              ? "bg-gray-700 text-gray-100 border-gray-600 placeholder-gray-500"
              : "bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400"
          }`}
        />

        {/* Footer: char count + SMS pages */}
        <div className="flex items-center justify-between">
          <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
            Click a variable to insert it at cursor position
          </p>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-mono ${
              charCount > 320
                ? "text-red-500"
                : charCount > 160
                ? isDarkMode ? "text-yellow-400" : "text-yellow-600"
                : isDarkMode ? "text-gray-500" : "text-gray-400"
            }`}>
              {charCount} chars
            </span>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
              isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
            }`}>
              {smsPages} SMS {smsPages > 1 ? "pages" : "page"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SettingsDetilas() {
  const { isDarkMode } = useSidebar();
  const { language }   = useLanguage();
  const t = (en: string, bn: string) => language === "bn" ? bn : en;

  const [activeTab, setActiveTab] = useState<Tab>("admission");
  const [settings, setSettings]   = useState<Settings>(DEFAULTS);
  const [saved,    setSaved]       = useState(false);
  const [loading,  setLoading]     = useState(true);
  const [saving,   setSaving]      = useState(false);

  // Load from backend on mount
  useEffect(() => {
    getSMSSettings().then((res) => {
      if (res.success && res.data) {
        setSettings((prev) => {
          const next = { ...prev };
          (Object.keys(next) as (keyof Settings)[]).forEach((key) => {
            if (res.data![key]) {
              next[key] = { enabled: res.data![key].enabled, message: res.data![key].message };
            }
          });
          return next;
        });
      }
    }).finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof Settings>(key: K, val: Settings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await saveSMSSettings(settings as Record<import("@/app/actions/smsSettings").SMSSettingKey, { enabled: boolean; message: string }>);
      if (res.success) {
        setSaved(true);
        toast.success(t("Settings saved successfully!", "সেটিংস সফলভাবে সংরক্ষিত হয়েছে!"));
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast.error(res.error ?? t("Failed to save settings", "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে"));
      }
    } catch {
      toast.error(t("Failed to save settings", "সেটিংস সংরক্ষণ ব্যর্থ হয়েছে"));
    } finally {
      setSaving(false);
    }
  };

  const cardBase = {
    isDarkMode,
    variables: VARS.common,
  };

  // ── Tab content map ──
  const tabContent: Record<Tab, React.ReactNode> = {
    admission: (
      <div className="space-y-4">
        <SMSSettingCard
          {...cardBase}
          icon={<FaUserPlus />}
          iconColor="text-blue-500"
          bgColor={isDarkMode ? "bg-blue-900/30" : "bg-blue-50"}
          title={t("Admission Confirmation SMS", "ভর্তি নিশ্চিতকরণ SMS")}
          description={t(
            "Sent to parent/guardian when a new student is successfully admitted.",
            "নতুন ছাত্র ভর্তি হলে অভিভাবককে পাঠানো হয়।"
          )}
          trigger={t("Trigger: on admission save", "ট্রিগার: ভর্তি সংরক্ষণে")}
          setting={settings.admission}
          onChange={(v) => update("admission", v)}
        />
      </div>
    ),

    attendance: (
      <div className="space-y-4">
        <SMSSettingCard
          {...cardBase}
          icon={<FaUserCheck />}
          iconColor="text-green-500"
          bgColor={isDarkMode ? "bg-green-900/30" : "bg-green-50"}
          title={t("Present Notification SMS", "উপস্থিত বিজ্ঞপ্তি SMS")}
          description={t(
            "Sent to parent when student is marked present.",
            "ছাত্র উপস্থিত হলে অভিভাবককে পাঠানো হয়।"
          )}
          trigger={t("Trigger: on attendance marked present", "ট্রিগার: উপস্থিত চিহ্নিত হলে")}
          setting={settings.attendancePresent}
          onChange={(v) => update("attendancePresent", v)}
        />
        <SMSSettingCard
          {...cardBase}
          icon={<FaUserTimes />}
          iconColor="text-red-500"
          bgColor={isDarkMode ? "bg-red-900/30" : "bg-red-50"}
          title={t("Absent Alert SMS", "অনুপস্থিত সতর্কতা SMS")}
          description={t(
            "Sent to parent when student is marked absent.",
            "ছাত্র অনুপস্থিত হলে অভিভাবককে পাঠানো হয়।"
          )}
          trigger={t("Trigger: on attendance marked absent", "ট্রিগার: অনুপস্থিত চিহ্নিত হলে")}
          setting={settings.attendanceAbsent}
          onChange={(v) => update("attendanceAbsent", v)}
        />
      </div>
    ),

    exam: (
      <div className="space-y-4">
        <SMSSettingCard
          {...cardBase}
          icon={<FaCalendarAlt />}
          iconColor="text-indigo-500"
          bgColor={isDarkMode ? "bg-indigo-900/30" : "bg-indigo-50"}
          title={t("Exam Scheduled SMS", "পরীক্ষা নির্ধারণ SMS")}
          description={t(
            "Sent to all students in the class/batch when a new exam is scheduled.",
            "নতুন পরীক্ষা নির্ধারণ করা হলে ব্যাচের সকল ছাত্রকে পাঠানো হয়।"
          )}
          trigger={t("Trigger: on exam create", "ট্রিগার: পরীক্ষা তৈরিতে")}
          setting={settings.examScheduled}
          variables={[...VARS.common, ...VARS.examSchedule]}
          onChange={(v) => update("examScheduled", v)}
        />
        <SMSSettingCard
          {...cardBase}
          icon={<FaGraduationCap />}
          iconColor="text-purple-500"
          bgColor={isDarkMode ? "bg-purple-900/30" : "bg-purple-50"}
          title={t("Exam Result SMS", "পরীক্ষার ফলাফল SMS")}
          description={t(
            "Sent to parent when exam results are published.",
            "পরীক্ষার ফলাফল প্রকাশ হলে অভিভাবককে পাঠানো হয়।"
          )}
          trigger={t("Trigger: on result publish", "ট্রিগার: ফলাফল প্রকাশে")}
          setting={settings.examResult}
          variables={[...VARS.common, ...VARS.examResult]}
          onChange={(v) => update("examResult", v)}
        />
        <SMSSettingCard
          {...cardBase}
          icon={<FaBullhorn />}
          iconColor="text-orange-500"
          bgColor={isDarkMode ? "bg-orange-900/30" : "bg-orange-50"}
          title={t("Custom Alert SMS Template", "কাস্টম সতর্কতা SMS টেমপ্লেট")}
          description={t(
            "Default wrapper template when teacher sends a custom alert from the exam list. Use {alertMessage} as the placeholder for the custom text.",
            "শিক্ষক যখন পরীক্ষার তালিকা থেকে কাস্টম সতর্কতা পাঠান তখন ব্যবহৃত র‍্যাপার টেমপ্লেট। কাস্টম টেক্সটের জায়গায় {alertMessage} ব্যবহার করুন।"
          )}
          trigger={t("Trigger: teacher clicks Send Alert button", "ট্রিগার: শিক্ষক সতর্কতা পাঠান বোতাম ক্লিক করলে")}
          setting={settings.examAlert}
          variables={[...VARS.common, ...VARS.examAlert]}
          onChange={(v) => update("examAlert", v)}
        />
      </div>
    ),

    fee: (
      <div className="space-y-4">
        <SMSSettingCard
          {...cardBase}
          icon={<FaCheckCircle />}
          iconColor="text-green-500"
          bgColor={isDarkMode ? "bg-green-900/30" : "bg-green-50"}
          title={t("Payment Confirmation SMS", "পেমেন্ট নিশ্চিতকরণ SMS")}
          description={t(
            "Sent to parent when a fee payment is recorded.",
            "ফি পরিশোধ রেকর্ড হলে অভিভাবককে পাঠানো হয়।"
          )}
          trigger={t("Trigger: on payment saved", "ট্রিগার: পেমেন্ট সংরক্ষণে")}
          setting={settings.feePaid}
          variables={[...VARS.common, ...VARS.fee]}
          onChange={(v) => update("feePaid", v)}
        />
        <SMSSettingCard
          {...cardBase}
          icon={<FaBell />}
          iconColor="text-yellow-500"
          bgColor={isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50"}
          title={t("Fee Reminder SMS", "ফি অনুস্মারক SMS")}
          description={t(
            "Sent to remind parents about upcoming or pending fee payment.",
            "আসন্ন বা মুলতুবি ফি পেমেন্ট সম্পর্কে অভিভাবককে স্মরণ করিয়ে দেয়।"
          )}
          trigger={t("Trigger: manually or scheduled reminder", "ট্রিগার: ম্যানুয়াল বা নির্ধারিত অনুস্মারক")}
          setting={settings.feeReminder}
          variables={[...VARS.common, ...VARS.fee]}
          onChange={(v) => update("feeReminder", v)}
        />
        <SMSSettingCard
          {...cardBase}
          icon={<FaExclamationTriangle />}
          iconColor="text-red-500"
          bgColor={isDarkMode ? "bg-red-900/30" : "bg-red-50"}
          title={t("Overdue Fee Alert SMS", "মেয়াদোত্তীর্ণ ফি সতর্কতা SMS")}
          description={t(
            "Sent when a fee payment is past its due date.",
            "ফি পেমেন্টের মেয়াদ উত্তীর্ণ হলে অভিভাবককে পাঠানো হয়।"
          )}
          trigger={t("Trigger: when fee becomes overdue", "ট্রিগার: ফি মেয়াদোত্তীর্ণ হলে")}
          setting={settings.feeOverdue}
          variables={[...VARS.common, ...VARS.fee]}
          onChange={(v) => update("feeOverdue", v)}
        />
      </div>
    ),
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="p-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isDarkMode ? "bg-blue-900/30" : "bg-blue-50"
            }`}>
              <FaSms className="text-xl text-blue-500" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDarkMode ? "text-gray-100" : "text-gray-900"}`}>
                {t("Message & Alert Settings", "বার্তা ও সতর্কতা সেটিংস")}
              </h1>
              <p className={`text-sm mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                {t(
                  "Configure automatic SMS templates and triggers for all modules.",
                  "সকল মডিউলের জন্য স্বয়ংক্রিয় SMS টেমপ্লেট ও ট্রিগার কনফিগার করুন।"
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-all duration-150 shrink-0 disabled:opacity-60 ${
              saved
                ? isDarkMode ? "bg-green-700 text-white" : "bg-green-600 text-white"
                : isDarkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {saving ? <FaSpinner className="animate-spin" /> : saved ? <FaCheckCircle /> : <FaSave />}
            {saving ? t("Saving...", "সংরক্ষণ হচ্ছে...") : saved ? t("Saved!", "সংরক্ষিত!") : t("Save Changes", "পরিবর্তন সংরক্ষণ করুন")}
          </button>
        </div>

        {/* ── Info banner ── */}
        <div className={`flex items-start gap-3 p-4 rounded-xl mb-6 border ${
          isDarkMode
            ? "bg-blue-900/20 border-blue-800/40 text-blue-300"
            : "bg-blue-50 border-blue-100 text-blue-700"
        }`}>
          <FaInfoCircle className="mt-0.5 shrink-0 text-sm" />
          <p className="text-xs leading-relaxed">
            {t(
              "Use the variable chips (e.g. {studentName}) to insert dynamic data into your message. Click a chip to insert it at the cursor position. Auto-send controls whether the SMS fires automatically on the trigger event.",
              "বার্তায় গতিশীল তথ্য যুক্ত করতে ভেরিয়েবল চিপস ব্যবহার করুন (যেমন {studentName})। অটো-সেন্ড চালু থাকলে ট্রিগার ঘটনায় SMS স্বয়ংক্রিয়ভাবে পাঠানো হবে।"
            )}
          </p>
        </div>

        {/* ── Tabs ── */}
        <div className={`flex gap-1 p-1 rounded-xl mb-6 ${isDarkMode ? "bg-gray-800" : "bg-gray-200/60"}`}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? isDarkMode
                      ? "bg-gray-700 text-white shadow-sm"
                      : "bg-white text-gray-900 shadow-sm"
                    : isDarkMode
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <span className={isActive ? (isDarkMode ? "text-blue-400" : "text-blue-600") : ""}>{tab.icon}</span>
                <span className="hidden sm:inline">{language === "bn" ? tab.labelBn : tab.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab content ── */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FaSpinner className={`animate-spin text-3xl ${isDarkMode ? "text-blue-400" : "text-blue-500"}`} />
          </div>
        ) : (
          <div>{tabContent[activeTab]}</div>
        )}


      </div>
    </div>
  );
}
