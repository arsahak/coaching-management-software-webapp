"use client";

import {
  createQRCode,
  deleteQRCode,
  getQRCodes,
  QRCodeData,
  updateQRCode,
} from "@/app/actions/qrCode";
import { useLanguage } from "@/lib/LanguageContext";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import {
  FaCheckCircle,
  FaCopy,
  FaEdit,
  FaEye,
  FaFile,
  FaLink,
  FaPlus,
  FaPrint,
  FaQrcode,
  FaSearch,
  FaTimesCircle,
  FaTrash,
  FaUser,
} from "react-icons/fa";

interface QRCode {
  _id: string;
  name: string;
  type: "student" | "exam" | "admission" | "custom" | "url" | "text";
  content: string;
  description?: string;
  studentId?: string;
  admissionId?: string;
  examId?: string;
  expiresAt?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  qrCodeData?: string; // Base64 or data URL for QR code image
}

export default function QRCodeManagement() {
  const { isDarkMode } = useSidebar();
  const { language } = useLanguage();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [selectedQRCode, setSelectedQRCode] = useState<QRCode | null>(null);
  const [viewMode, setViewMode] = useState<
    "list" | "create" | "edit" | "preview"
  >("list");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<{
    type?: string;
    isActive?: boolean;
  }>({});
  const [previewQR, setPreviewQR] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form state
  const [qrForm, setQrForm] = useState<QRCodeData>({
    name: "",
    type: "custom",
    content: "",
    description: "",
    isActive: true,
    expiresAt: "",
  });

  // Load QR codes
  useEffect(() => {
    loadQRCodes();
  }, [filters, search]);

  const loadQRCodes = async () => {
    startTransition(async () => {
      try {
        setLoadError(null);
        const result = await getQRCodes(1, 100, {
          ...filters,
          search: search || undefined,
        });

        if (result.success && result.data) {
          const data = Array.isArray(result.data) ? result.data : [];
          setQRCodes(data as QRCode[]);
          setLoadError(null);
        } else {
          // Show error if API call failed
          const errorMessage = result.error || "Failed to load QR codes";
          console.error("Failed to load QR codes:", errorMessage);
          setLoadError(errorMessage);
          setQRCodes([]);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Error loading QR codes:", error);
        setLoadError(errorMessage);
        setQRCodes([]);
      }
    });
  };

  const handleCreateQRCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!qrForm.name || !qrForm.content) {
      toast.error(
        language === "bn"
          ? "নাম এবং কনটেন্ট প্রয়োজন"
          : "Name and content are required"
      );
      return;
    }

    startTransition(async () => {
      const result = await createQRCode(qrForm);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "QR কোড সফলভাবে তৈরি করা হয়েছে"
            : "QR code created successfully"
        );
        setViewMode("list");
        resetForm();
        loadQRCodes();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "QR কোড তৈরি করতে ব্যর্থ"
              : "Failed to create QR code")
        );
      }
    });
  };

  const handleUpdateQRCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQRCode) return;

    if (!qrForm.name || !qrForm.content) {
      toast.error(
        language === "bn"
          ? "নাম এবং কনটেন্ট প্রয়োজন"
          : "Name and content are required"
      );
      return;
    }

    startTransition(async () => {
      const result = await updateQRCode(selectedQRCode._id, qrForm);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "QR কোড সফলভাবে আপডেট করা হয়েছে"
            : "QR code updated successfully"
        );
        setViewMode("list");
        setSelectedQRCode(null);
        resetForm();
        loadQRCodes();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "QR কোড আপডেট করতে ব্যর্থ"
              : "Failed to update QR code")
        );
      }
    });
  };

  const handleDeleteQRCode = async (id: string) => {
    if (
      !confirm(
        language === "bn"
          ? "আপনি কি এই QR কোড মুছে ফেলতে চান?"
          : "Are you sure you want to delete this QR code?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteQRCode(id);

      if (result.success) {
        toast.success(
          language === "bn"
            ? "QR কোড সফলভাবে মুছে ফেলা হয়েছে"
            : "QR code deleted successfully"
        );
        loadQRCodes();
      } else {
        toast.error(
          result.error ||
            (language === "bn"
              ? "QR কোড মুছতে ব্যর্থ"
              : "Failed to delete QR code")
        );
      }
    });
  };

  const handleEdit = (qrCode: QRCode) => {
    setSelectedQRCode(qrCode);
    setQrForm({
      name: qrCode.name,
      type: qrCode.type,
      content: qrCode.content,
      description: qrCode.description || "",
      studentId: qrCode.studentId,
      admissionId: qrCode.admissionId,
      examId: qrCode.examId,
      expiresAt: qrCode.expiresAt
        ? new Date(qrCode.expiresAt).toISOString().split("T")[0]
        : "",
      isActive: qrCode.isActive,
      metadata: qrCode.metadata,
    });
    setViewMode("edit");
  };

  const handlePreview = (qrCode: QRCode) => {
    setSelectedQRCode(qrCode);
    setPreviewQR(qrCode.content);
    setViewMode("preview");
  };

  const resetForm = () => {
    setQrForm({
      name: "",
      type: "custom",
      content: "",
      description: "",
      isActive: true,
      expiresAt: "",
    });
    setSelectedQRCode(null);
  };

  const handleCopyContent = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success(
      language === "bn"
        ? "কনটেন্ট কপি করা হয়েছে"
        : "Content copied to clipboard"
    );
  };

  const handleDownloadQR = (qrCode: QRCode) => {
    // Create a canvas element to render QR code
    const canvas = document.createElement("canvas");
    const size = 500;
    canvas.width = size;
    canvas.height = size;

    // We'll use a different approach - create a download link
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", size.toString());
    svg.setAttribute("height", size.toString());
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // For now, we'll copy the content and let user generate it elsewhere
    // Or we can create a simple download using the QRCodeSVG component
    toast(
      language === "bn"
        ? "QR কোড দেখতে পূর্বরূপ দেখুন"
        : "View preview to see QR code"
    );
    handlePreview(qrCode);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "student":
        return <FaUser className="w-4 h-4" />;
      case "exam":
        return <FaFile className="w-4 h-4" />;
      case "admission":
        return <FaUser className="w-4 h-4" />;
      case "url":
        return <FaLink className="w-4 h-4" />;
      case "text":
        return <FaFile className="w-4 h-4" />;
      default:
        return <FaQrcode className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; bn: string }> = {
      student: { en: "Student", bn: "ছাত্র" },
      exam: { en: "Exam", bn: "পরীক্ষা" },
      admission: { en: "Admission", bn: "ভর্তি" },
      custom: { en: "Custom", bn: "কাস্টম" },
      url: { en: "URL", bn: "ইউআরএল" },
      text: { en: "Text", bn: "টেক্সট" },
    };
    const label = labels[type];
    if (label && language in label) {
      return label[language as "en" | "bn"];
    }
    return type;
  };

  const filteredQRCodes = qrCodes.filter((qr) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        qr.name.toLowerCase().includes(searchLower) ||
        qr.content.toLowerCase().includes(searchLower) ||
        (qr.description && qr.description.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  // Preview Mode
  if (viewMode === "preview" && previewQR) {
    return (
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="p-6 max-w-2xl mx-auto">
          <div
            className={`p-6 rounded-xl shadow-lg transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-2xl font-bold transition-colors duration-200 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {language === "bn" ? "QR কোড পূর্বরূপ" : "QR Code Preview"}
              </h2>
              <button
                onClick={() => {
                  setViewMode("list");
                  setPreviewQR(null);
                  setSelectedQRCode(null);
                }}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                {language === "bn" ? "বন্ধ করুন" : "Close"}
              </button>
            </div>

            {selectedQRCode && (
              <div className="mb-4">
                <h3
                  className={`text-lg font-semibold mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  {selectedQRCode.name}
                </h3>
                {selectedQRCode.description && (
                  <p
                    className={`text-sm transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {selectedQRCode.description}
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg">
              <QRCodeSVG
                value={previewQR}
                size={300}
                level="H"
                includeMargin={true}
                bgColor="#ffffff"
                fgColor="#000000"
              />
              <div className="mt-4 text-center">
                <p
                  className={`text-sm break-all max-w-md transition-colors duration-200 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  {previewQR}
                </p>
                <button
                  onClick={() => handleCopyContent(previewQR)}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 mx-auto"
                >
                  <FaCopy />
                  {language === "bn" ? "কনটেন্ট কপি করুন" : "Copy Content"}
                </button>
              </div>
            </div>

            <div className="mt-6 flex gap-2 justify-center">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
              >
                <FaPrint />
                {language === "bn" ? "প্রিন্ট" : "Print"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit Form
  if (viewMode === "create" || viewMode === "edit") {
    return (
      <div
        className={`min-h-screen transition-colors duration-200 ${
          isDarkMode ? "bg-gray-900" : "bg-gray-50"
        }`}
      >
        <div className="p-6 max-w-4xl mx-auto">
          <div
            className={`p-6 rounded-xl shadow-lg transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2
                className={`text-2xl font-bold transition-colors duration-200 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                {viewMode === "create"
                  ? language === "bn"
                    ? "নতুন QR কোড তৈরি করুন"
                    : "Create New QR Code"
                  : language === "bn"
                  ? "QR কোড সম্পাদনা করুন"
                  : "Edit QR Code"}
              </h2>
              <button
                onClick={() => {
                  setViewMode("list");
                  resetForm();
                }}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                  isDarkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                }`}
              >
                {language === "bn" ? "বাতিল" : "Cancel"}
              </button>
            </div>

            <form
              onSubmit={
                viewMode === "create" ? handleCreateQRCode : handleUpdateQRCode
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
                    {language === "bn" ? "নাম" : "Name"} *
                  </label>
                  <input
                    type="text"
                    value={qrForm.name}
                    onChange={(e) =>
                      setQrForm({ ...qrForm, name: e.target.value })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                    placeholder={
                      language === "bn" ? "QR কোডের নাম" : "QR Code Name"
                    }
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "ধরন" : "Type"} *
                  </label>
                  <select
                    value={qrForm.type}
                    onChange={(e) =>
                      setQrForm({
                        ...qrForm,
                        type: e.target.value as QRCodeData["type"],
                      })
                    }
                    required
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  >
                    <option value="custom">
                      {language === "bn" ? "কাস্টম" : "Custom"}
                    </option>
                    <option value="student">
                      {language === "bn" ? "ছাত্র" : "Student"}
                    </option>
                    <option value="exam">
                      {language === "bn" ? "পরীক্ষা" : "Exam"}
                    </option>
                    <option value="admission">
                      {language === "bn" ? "ভর্তি" : "Admission"}
                    </option>
                    <option value="url">
                      {language === "bn" ? "ইউআরএল" : "URL"}
                    </option>
                    <option value="text">
                      {language === "bn" ? "টেক্সট" : "Text"}
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {language === "bn" ? "কনটেন্ট" : "Content"} *
                </label>
                <textarea
                  value={qrForm.content}
                  onChange={(e) =>
                    setQrForm({ ...qrForm, content: e.target.value })
                  }
                  required
                  rows={4}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                  placeholder={
                    language === "bn"
                      ? "QR কোডে থাকবে এমন কনটেন্ট"
                      : "Content to encode in QR code"
                  }
                />
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
                  value={qrForm.description || ""}
                  onChange={(e) =>
                    setQrForm({ ...qrForm, description: e.target.value })
                  }
                  rows={2}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300 bg-white text-gray-900"
                  }`}
                  placeholder={
                    language === "bn" ? "বিবরণ" : "Description (optional)"
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "মেয়াদ শেষ" : "Expires At"}
                  </label>
                  <input
                    type="date"
                    value={qrForm.expiresAt || ""}
                    onChange={(e) =>
                      setQrForm({ ...qrForm, expiresAt: e.target.value })
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      isDarkMode
                        ? "border-gray-600 bg-gray-700 text-white"
                        : "border-gray-300 bg-white text-gray-900"
                    }`}
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qrForm.isActive !== false}
                      onChange={(e) =>
                        setQrForm({ ...qrForm, isActive: e.target.checked })
                      }
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span
                      className={`ml-2 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {language === "bn" ? "সক্রিয়" : "Active"}
                    </span>
                  </label>
                </div>
              </div>

              {/* Live Preview */}
              {qrForm.content && (
                <div
                  className={`p-4 rounded-lg border transition-colors duration-200 ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700"
                      : "border-gray-300 bg-gray-50"
                  }`}
                >
                  <p
                    className={`text-sm font-medium mb-3 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    {language === "bn" ? "পূর্বরূপ" : "Preview"}
                  </p>
                  <div className="flex items-center justify-center p-4 bg-white rounded-lg">
                    <QRCodeSVG
                      value={qrForm.content}
                      size={200}
                      level="H"
                      includeMargin={true}
                      bgColor="#ffffff"
                      fgColor="#000000"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setViewMode("list");
                    resetForm();
                  }}
                  className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 hover:bg-gray-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  }`}
                >
                  {language === "bn" ? "বাতিল" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
        </div>
      </div>
    );
  }

  // List View
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
            {language === "bn" ? "QR কোড ব্যবস্থাপনা" : "QR Code Management"}
          </h1>
          <p
            className={`text-sm transition-colors duration-200 ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {language === "bn"
              ? "QR কোড তৈরি করুন, পরিচালনা করুন এবং দেখুন"
              : "Create, manage, and view QR codes"}
          </p>
        </div>

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
                      ? "নাম, কনটেন্ট..."
                      : "Search name, content..."
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
                value={filters.type || ""}
                onChange={(e) =>
                  setFilters({ ...filters, type: e.target.value || undefined })
                }
                className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  isDarkMode
                    ? "border-gray-600 bg-gray-700 text-white"
                    : "border-gray-300 bg-white text-gray-900"
                }`}
              >
                <option value="">
                  {language === "bn" ? "সব ধরন" : "All Types"}
                </option>
                <option value="student">
                  {language === "bn" ? "ছাত্র" : "Student"}
                </option>
                <option value="exam">
                  {language === "bn" ? "পরীক্ষা" : "Exam"}
                </option>
                <option value="admission">
                  {language === "bn" ? "ভর্তি" : "Admission"}
                </option>
                <option value="custom">
                  {language === "bn" ? "কাস্টম" : "Custom"}
                </option>
                <option value="url">
                  {language === "bn" ? "ইউআরএল" : "URL"}
                </option>
                <option value="text">
                  {language === "bn" ? "টেক্সট" : "Text"}
                </option>
              </select>

              <select
                value={
                  filters.isActive === undefined
                    ? ""
                    : filters.isActive.toString()
                }
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    isActive:
                      e.target.value === ""
                        ? undefined
                        : e.target.value === "true",
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
                <option value="true">
                  {language === "bn" ? "সক্রিয়" : "Active"}
                </option>
                <option value="false">
                  {language === "bn" ? "নিষ্ক্রিয়" : "Inactive"}
                </option>
              </select>

              <button
                onClick={() => {
                  resetForm();
                  setViewMode("create");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all flex items-center gap-2"
              >
                <FaPlus />
                {language === "bn" ? "নতুন QR কোড" : "New QR Code"}
              </button>
            </div>
          </div>
        </div>

        {/* QR Codes Grid */}
        {isPending ? (
          <div className="text-center py-12">
            <p
              className={`transition-colors duration-200 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
            </p>
          </div>
        ) : loadError ? (
          <div
            className={`text-center py-12 rounded-xl transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <FaQrcode
              className={`mx-auto text-6xl mb-4 transition-colors duration-200 ${
                isDarkMode ? "text-red-600" : "text-red-400"
              }`}
            />
            <p
              className={`text-lg font-semibold mb-2 transition-colors duration-200 ${
                isDarkMode ? "text-red-400" : "text-red-600"
              }`}
            >
              {language === "bn"
                ? "QR কোড লোড করতে ব্যর্থ"
                : "Failed to load QR codes"}
            </p>
            <p
              className={`text-sm transition-colors duration-200 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {loadError}
            </p>
            <button
              onClick={loadQRCodes}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {language === "bn" ? "পুনরায় চেষ্টা করুন" : "Retry"}
            </button>
          </div>
        ) : filteredQRCodes.length === 0 ? (
          <div
            className={`text-center py-12 rounded-xl transition-colors duration-200 ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <FaQrcode
              className={`mx-auto text-6xl mb-4 transition-colors duration-200 ${
                isDarkMode ? "text-gray-600" : "text-gray-300"
              }`}
            />
            <p
              className={`text-lg transition-colors duration-200 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {language === "bn"
                ? "কোন QR কোড পাওয়া যায়নি"
                : "No QR codes found"}
            </p>
            <button
              onClick={() => {
                resetForm();
                setViewMode("create");
              }}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              {language === "bn"
                ? "প্রথম QR কোড তৈরি করুন"
                : "Create Your First QR Code"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQRCodes.map((qrCode) => (
              <div
                key={qrCode._id}
                className={`p-6 rounded-xl shadow-md transition-colors duration-200 ${
                  isDarkMode ? "bg-gray-800" : "bg-white"
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3
                      className={`text-lg font-semibold mb-1 transition-colors duration-200 ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {qrCode.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          qrCode.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {qrCode.isActive ? (
                          <FaCheckCircle className="w-3 h-3" />
                        ) : (
                          <FaTimesCircle className="w-3 h-3" />
                        )}
                        {qrCode.isActive
                          ? language === "bn"
                            ? "সক্রিয়"
                            : "Active"
                          : language === "bn"
                          ? "নিষ্ক্রিয়"
                          : "Inactive"}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                          isDarkMode
                            ? "bg-gray-700 text-gray-300"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {getTypeIcon(qrCode.type)}
                        {getTypeLabel(qrCode.type)}
                      </span>
                    </div>
                  </div>
                </div>

                {qrCode.description && (
                  <p
                    className={`text-sm mb-4 line-clamp-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {qrCode.description}
                  </p>
                )}

                {/* QR Code Preview */}
                <div className="flex items-center justify-center p-4 bg-white rounded-lg mb-4">
                  <QRCodeSVG
                    value={qrCode.content}
                    size={150}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                </div>

                <div
                  className={`text-xs mb-4 p-2 rounded break-all transition-colors duration-200 ${
                    isDarkMode
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {qrCode.content}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePreview(qrCode)}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-all flex items-center justify-center gap-2"
                  >
                    <FaEye />
                    {language === "bn" ? "দেখুন" : "View"}
                  </button>
                  <button
                    onClick={() => handleEdit(qrCode)}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-all"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleCopyContent(qrCode.content)}
                    className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm transition-all"
                    title={language === "bn" ? "কপি" : "Copy"}
                  >
                    <FaCopy />
                  </button>
                  <button
                    onClick={() => handleDeleteQRCode(qrCode._id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all"
                  >
                    <FaTrash />
                  </button>
                </div>

                {qrCode.expiresAt && (
                  <p
                    className={`text-xs mt-2 transition-colors duration-200 ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {language === "bn" ? "মেয়াদ শেষ" : "Expires"}:{" "}
                    {new Date(qrCode.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
