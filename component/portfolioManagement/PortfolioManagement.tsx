"use client";
import { getPortfolio, updatePortfolio } from "@/app/actions/portflio";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import {
  MdArrowBack,
  MdEmail,
  MdImage,
  MdLanguage,
  MdPalette,
  MdPublic,
  MdSave,
  MdTitle,
} from "react-icons/md";

const PortfolioManagement = () => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    appTitle: "",
    appLogo: "",
    appDescription: "",
    appTagline: "",
    primaryColor: "#3B82F6",
    secondaryColor: "#8B5CF6",
    accentColor: "#10B981",
    email: "",
    phone: "",
    address: "",
    website: "",
    socialMedia: {
      facebook: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      youtube: "",
    },
    metaKeywords: "",
    metaDescription: "",
    copyrightText: "",
  });

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const result = await getPortfolio();

      if (result.success && result.data) {
        const portfolio = result.data;
        console.log("Portfolio fetched successfully:", portfolio);

        setFormData({
          appTitle: portfolio.appTitle || "",
          appLogo: portfolio.appLogo || "",
          appDescription: portfolio.appDescription || "",
          appTagline: portfolio.appTagline || "",
          primaryColor: portfolio.primaryColor || "#3B82F6",
          secondaryColor: portfolio.secondaryColor || "#8B5CF6",
          accentColor: portfolio.accentColor || "#10B981",
          email: portfolio.email || "",
          phone: portfolio.phone || "",
          address: portfolio.address || "",
          website: portfolio.website || "",
          socialMedia: portfolio.socialMedia
            ? {
                facebook: portfolio.socialMedia.facebook || "",
                twitter: portfolio.socialMedia.twitter || "",
                instagram: portfolio.socialMedia.instagram || "",
                linkedin: portfolio.socialMedia.linkedin || "",
                youtube: portfolio.socialMedia.youtube || "",
              }
            : {
                facebook: "",
                twitter: "",
                instagram: "",
                linkedin: "",
                youtube: "",
              },
          metaKeywords: portfolio.metaKeywords || "",
          metaDescription: portfolio.metaDescription || "",
          copyrightText: portfolio.copyrightText || "",
        });
      } else {
        toast.error(result.error || "Failed to fetch portfolio settings");
      }
    } catch (error) {
      console.error("Error fetching portfolio:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch portfolio settings";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const result = await updatePortfolio(formData);

      if (result.success) {
        toast.success(
          result.message || "Portfolio settings updated successfully!"
        );
      } else {
        toast.error(result.error || "Failed to update portfolio settings");
      }
    } catch (error) {
      console.error("Error updating portfolio:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update portfolio settings";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    if (name.startsWith("socialMedia.")) {
      const socialKey = name.split(".")[1];
      setFormData({
        ...formData,
        socialMedia: {
          ...formData.socialMedia,
          [socialKey]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PNG, JPG, or WEBP image");
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingLogo(true);
    try {
      // Convert file to base64
      const base64Image = await convertFileToBase64(file);

      // Upload to imgbb using FormData
      const uploadFormData = new FormData();
      uploadFormData.append("key", "8e5691634c513ea3f568ede1970f9506");
      uploadFormData.append("image", base64Image);

      const response = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.data && data.data.url) {
        setFormData({
          ...formData,
          appLogo: data.data.url,
        });
        toast.success("Logo uploaded successfully!");
      } else {
        const errorMsg =
          data.error?.message || data.status_txt || "Failed to upload logo";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload logo. Please try again.";
      toast.error(errorMessage);
    } finally {
      setUploadingLogo(false);
      // Reset input
      e.target.value = "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => router.back()}
        className={`flex items-center gap-2 mb-4 ${
          isDarkMode
            ? "text-gray-400 hover:text-gray-300"
            : "text-gray-600 hover:text-gray-800"
        }`}
      >
        <MdArrowBack className="text-xl" />
        Back
      </button>

      <h1
        className={`text-3xl font-bold mb-2 ${
          isDarkMode ? "text-gray-100" : "text-gray-900"
        }`}
      >
        Portfolio Management
      </h1>
      <p className={`mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
        Manage your app title, logo, branding, and portfolio-related settings
      </p>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* App Information */}
            <div
              className={`rounded-lg border-2 p-6 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <MdTitle className="text-2xl text-indigo-500" />
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  App Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    App Title *
                  </label>
                  <input
                    type="text"
                    name="appTitle"
                    value={formData.appTitle}
                    onChange={handleChange}
                    required
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="Coaching Center"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    App Logo
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <label
                        className={`flex-1 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                          uploadingLogo
                            ? "opacity-50 cursor-not-allowed"
                            : isDarkMode
                            ? "bg-gray-700 border-gray-600 hover:border-indigo-500 text-gray-300"
                            : "bg-gray-50 border-gray-300 hover:border-indigo-500 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <MdImage className="text-xl" />
                          <span>
                            {uploadingLogo
                              ? "Uploading..."
                              : formData.appLogo
                              ? "Change Logo"
                              : "Upload Logo (PNG, JPG, WEBP - Max 5MB)"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleLogoUpload}
                          disabled={uploadingLogo}
                          className="hidden"
                        />
                      </label>
                      {formData.appLogo && (
                        <div className="w-12 h-12 rounded-lg border-gray-300 overflow-hidden bg-white flex items-center justify-center shrink-0">
                          <img
                            src={formData.appLogo}
                            alt="Logo preview"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    {uploadingLogo && (
                      <div className="flex items-center gap-2 text-sm text-indigo-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span>Uploading image to imgbb...</span>
                      </div>
                    )}
                    {formData.appLogo && (
                      <p
                        className={`text-xs ${
                          isDarkMode ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        Logo URL: {formData.appLogo}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    App Tagline
                  </label>
                  <input
                    type="text"
                    name="appTagline"
                    value={formData.appTagline}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="Your tagline here"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    App Description
                  </label>
                  <textarea
                    name="appDescription"
                    value={formData.appDescription}
                    onChange={handleChange}
                    rows={4}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="Describe your coaching center..."
                  />
                </div>
              </div>
            </div>

            {/* Branding Colors */}
            <div
              className={`rounded-lg border-2 p-6 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <MdPalette className="text-2xl text-purple-500" />
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Branding Colors
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="w-12 h-10 rounded border-2 border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div
              className={`rounded-lg border-2 p-6 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <MdEmail className="text-2xl text-blue-500" />
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Contact Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="contact@example.com"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="123 Main Street, City, State, ZIP"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="https://www.example.com"
                  />
                </div>
              </div>
            </div>

            {/* Social Media */}
            <div
              className={`rounded-lg border-2 p-6 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <MdPublic className="text-2xl text-green-500" />
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  Social Media
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaFacebook className="text-blue-600" />
                    Facebook
                  </label>
                  <input
                    type="url"
                    name="socialMedia.facebook"
                    value={formData.socialMedia.facebook}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>

                <div>
                  <label
                    className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaTwitter className="text-blue-400" />
                    Twitter
                  </label>
                  <input
                    type="url"
                    name="socialMedia.twitter"
                    value={formData.socialMedia.twitter}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="https://twitter.com/yourhandle"
                  />
                </div>

                <div>
                  <label
                    className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaInstagram className="text-pink-600" />
                    Instagram
                  </label>
                  <input
                    type="url"
                    name="socialMedia.instagram"
                    value={formData.socialMedia.instagram}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="https://instagram.com/yourhandle"
                  />
                </div>

                <div>
                  <label
                    className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaLinkedin className="text-blue-700" />
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    name="socialMedia.linkedin"
                    value={formData.socialMedia.linkedin}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="https://linkedin.com/company/yourcompany"
                  />
                </div>

                <div>
                  <label
                    className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    <FaYoutube className="text-red-600" />
                    YouTube
                  </label>
                  <input
                    type="url"
                    name="socialMedia.youtube"
                    value={formData.socialMedia.youtube}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
              </div>
            </div>

            {/* SEO & Meta */}
            <div
              className={`rounded-lg border-2 p-6 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-4">
                <MdLanguage className="text-2xl text-orange-500" />
                <h2
                  className={`text-xl font-bold ${
                    isDarkMode ? "text-gray-100" : "text-gray-900"
                  }`}
                >
                  SEO & Meta Information
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="metaKeywords"
                    value={formData.metaKeywords}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="coaching, education, learning, training"
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Meta Description
                  </label>
                  <textarea
                    name="metaDescription"
                    value={formData.metaDescription}
                    onChange={handleChange}
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="A brief description for search engines..."
                  />
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Copyright Text
                  </label>
                  <input
                    type="text"
                    name="copyrightText"
                    value={formData.copyrightText}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 rounded-lg border-2 ${
                      isDarkMode
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                    placeholder="© 2024 Coaching Center. All rights reserved."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview Sidebar */}
          <div>
            <div
              className={`rounded-lg border-2 p-6 sticky top-6 ${
                isDarkMode
                  ? "bg-gray-800 border-gray-700"
                  : "bg-white border-gray-200"
              }`}
            >
              <h3
                className={`text-lg font-bold mb-4 ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Preview
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <p
                    className={`text-xs mb-1 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    App Title
                  </p>
                  <p
                    className={`text-lg font-semibold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {formData.appTitle || "Coaching Center"}
                  </p>
                </div>

                {formData.appLogo && (
                  <div className="flex items-center gap-3">
                    <img
                      src={formData.appLogo}
                      alt="Logo preview"
                      className="w-16 h-16 object-contain rounded border border-gray-300 bg-white"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div>
                      <p
                        className={`text-xs mb-1 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Logo
                      </p>
                      <p
                        className={`text-xs truncate max-w-[150px] ${
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                        title={formData.appLogo}
                      >
                        {formData.appLogo}
                      </p>
                    </div>
                  </div>
                )}

                {formData.appTagline && (
                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Tagline
                    </p>
                    <p
                      className={`text-sm italic ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {formData.appTagline}
                    </p>
                  </div>
                )}

                <div>
                  <p
                    className={`text-xs mb-2 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Brand Colors
                  </p>
                  <div className="flex gap-2">
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: formData.primaryColor }}
                      title="Primary"
                    />
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: formData.secondaryColor }}
                      title="Secondary"
                    />
                    <div
                      className="w-8 h-8 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: formData.accentColor }}
                      title="Accent"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <MdSave />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PortfolioManagement;
