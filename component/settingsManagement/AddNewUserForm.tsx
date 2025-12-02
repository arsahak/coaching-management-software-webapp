"use client";
import { createSubUser } from "@/app/actions/userManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdAdminPanelSettings,
  MdArrowBack,
  MdCancel,
  MdCheckCircle,
  MdImage,
  MdLock,
  MdPeople,
  MdPerson,
} from "react-icons/md";

const AVAILABLE_ROUTES = [
  {
    id: "admission",
    name: "Get Admission",
    description: "Access to admission management and student enrollment",
    route: "/admission",
  },
  {
    id: "student",
    name: "Student Management",
    description: "View and manage student information",
    route: "/student",
  },
  {
    id: "exam",
    name: "Student Exam",
    description: "Access to exam management and results",
    route: "/exam",
  },
  {
    id: "fee",
    name: "Fee Management",
    description: "Manage fee collection and payment records",
    route: "/fee",
  },
  {
    id: "attendance",
    name: "Attendance",
    description: "Mark and view student attendance",
    route: "/attendance",
  },
  {
    id: "course",
    name: "Course Management",
    description: "Create and manage courses",
    route: "/course",
  },
  {
    id: "teacher",
    name: "Teacher Management",
    description: "Manage teacher information and assignments",
    route: "/teacher",
  },
  {
    id: "report",
    name: "Reports",
    description: "View and generate various reports",
    route: "/report",
  },
  {
    id: "settings",
    name: "Settings",
    description: "Access to system settings",
    route: "/settings",
  },
  {
    id: "add-user",
    name: "Add User",
    description: "Access to add new users and manage user creation",
    route: "/settings/add-user",
  },
];

const AddNewUserForm = () => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher",
    userType: "sub-user", // "main-user" or "sub-user"
    avatar: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setUploadingAvatar(true);
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
          avatar: data.data.url,
        });
        toast.success("Avatar uploaded successfully!");
      } else {
        const errorMsg =
          data.error?.message || data.status_txt || "Failed to upload avatar";
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to upload avatar. Please try again.";
      toast.error(errorMessage);
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const togglePermission = (routeId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(routeId)
        ? prev.filter((id) => id !== routeId)
        : [...prev, routeId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userData = {
        ...formData,
        permissions: selectedPermissions,
      };
      const result = await createSubUser(userData);
      if (result.success) {
        toast.success("User created successfully!");
        router.push("/settings");
      } else {
        toast.error(result.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6">
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

          <div className="flex items-center gap-4 mb-2">
            <div
              className={`p-4 rounded-lg ${
                isDarkMode ? "bg-indigo-900/30" : "bg-indigo-100"
              }`}
            >
              <MdPerson
                className={`text-4xl ${
                  isDarkMode ? "text-indigo-400" : "text-indigo-600"
                }`}
              />
            </div>
            <div>
              <h1
                className={`text-4xl font-bold ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Add New User
              </h1>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Create a new user account with role, permissions, and profile
                information
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Type & Basic Information */}
              <div
                className={`rounded-lg border-2 p-6 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-6">
                  <MdPerson className="text-2xl text-indigo-500" />
                  <h2
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    User Information
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* User Type */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-3 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      User Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, userType: "main-user" })
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.userType === "main-user"
                            ? isDarkMode
                              ? "bg-indigo-900/30 border-indigo-600"
                              : "bg-indigo-50 border-indigo-500"
                            : isDarkMode
                            ? "bg-gray-700 border-gray-600 hover:border-gray-500"
                            : "bg-gray-50 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MdAdminPanelSettings
                            className={`text-2xl ${
                              formData.userType === "main-user"
                                ? "text-indigo-500"
                                : isDarkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          />
                          <div className="text-left">
                            <p
                              className={`font-semibold ${
                                isDarkMode ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
                              Main User
                            </p>
                            <p
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Full system access
                            </p>
                          </div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, userType: "sub-user" })
                        }
                        className={`p-4 rounded-lg border-2 transition-all ${
                          formData.userType === "sub-user"
                            ? isDarkMode
                              ? "bg-indigo-900/30 border-indigo-600"
                              : "bg-indigo-50 border-indigo-500"
                            : isDarkMode
                            ? "bg-gray-700 border-gray-600 hover:border-gray-500"
                            : "bg-gray-50 border-gray-300 hover:border-gray-400"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <MdPeople
                            className={`text-2xl ${
                              formData.userType === "sub-user"
                                ? "text-indigo-500"
                                : isDarkMode
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          />
                          <div className="text-left">
                            <p
                              className={`font-semibold ${
                                isDarkMode ? "text-gray-100" : "text-gray-900"
                              }`}
                            >
                              Sub User
                            </p>
                            <p
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-600"
                              }`}
                            >
                              Limited access
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Avatar Upload */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Profile Picture
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.avatar && (
                        <div className="w-20 h-20 rounded-full border-2 border-gray-300 overflow-hidden bg-white flex items-center justify-center shrink-0">
                          <img
                            src={formData.avatar}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      )}
                      <label
                        className={`flex-1 px-4 py-3 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                          uploadingAvatar
                            ? "opacity-50 cursor-not-allowed"
                            : isDarkMode
                            ? "bg-gray-700 border-gray-600 hover:border-indigo-500 text-gray-300"
                            : "bg-gray-50 border-gray-300 hover:border-indigo-500 text-gray-700"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <MdImage className="text-xl" />
                          <span>
                            {uploadingAvatar
                              ? "Uploading..."
                              : formData.avatar
                              ? "Change Picture"
                              : "Upload Picture (PNG, JPG, WEBP - Max 5MB)"}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {uploadingAvatar && (
                      <div className="flex items-center gap-2 text-sm text-indigo-600 mt-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                        <span>Uploading image to imgbb...</span>
                      </div>
                    )}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Enter user's full name"
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="user@example.com"
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      placeholder="Minimum 6 characters"
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-500"
                          : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    />
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  {/* Role */}
                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Role *
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      } focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    >
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                      {formData.userType === "main-user" && (
                        <option value="admin">Admin</option>
                      )}
                    </select>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-500" : "text-gray-500"
                      }`}
                    >
                      Select the role for this user. Permissions can be managed
                      below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              {formData.userType === "sub-user" && (
                <div
                  className={`rounded-lg border-2 p-6 ${
                    isDarkMode
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-6">
                    <MdLock className="text-2xl text-purple-500" />
                    <h2
                      className={`text-xl font-bold ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      Route Permissions
                    </h2>
                  </div>

                  <p
                    className={`text-sm mb-6 ${
                      isDarkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Select which routes this user can access:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_ROUTES.map((route) => {
                      const hasPermission = selectedPermissions.includes(
                        route.id
                      );
                      return (
                        <div
                          key={route.id}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            hasPermission
                              ? isDarkMode
                                ? "bg-indigo-900/30 border-indigo-700"
                                : "bg-indigo-50 border-indigo-300"
                              : isDarkMode
                              ? "bg-gray-700 border-gray-600 hover:border-gray-500"
                              : "bg-gray-50 border-gray-300 hover:border-gray-400"
                          }`}
                          onClick={() => togglePermission(route.id)}
                        >
                          <div className="flex items-start gap-3">
                            {hasPermission ? (
                              <MdCheckCircle className="text-green-500 text-xl shrink-0 mt-0.5" />
                            ) : (
                              <MdCancel className="text-gray-400 text-xl shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <h4
                                className={`font-semibold mb-1 ${
                                  isDarkMode ? "text-gray-100" : "text-gray-900"
                                }`}
                              >
                                {route.name}
                              </h4>
                              <p
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                {route.description}
                              </p>
                              <p
                                className={`text-xs mt-1 ${
                                  isDarkMode ? "text-gray-500" : "text-gray-500"
                                }`}
                              >
                                {route.route}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {selectedPermissions.length > 0 && (
                    <div className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <p
                        className={`text-sm font-medium ${
                          isDarkMode ? "text-indigo-300" : "text-indigo-700"
                        }`}
                      >
                        {selectedPermissions.length} route
                        {selectedPermissions.length !== 1 ? "s" : ""} selected
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className={`flex-1 px-6 py-3 rounded-lg border-2 font-semibold transition-colors ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating User...
                    </>
                  ) : (
                    <>
                      <MdAdd className="text-xl" />
                      Create User
                    </>
                  )}
                </button>
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

                <div className="space-y-4">
                  {formData.avatar && (
                    <div className="flex justify-center">
                      <div className="w-24 h-24 rounded-full border-2 border-gray-300 overflow-hidden bg-white">
                        <img
                          src={formData.avatar}
                          alt="Avatar preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Name
                    </p>
                    <p
                      className={`font-semibold ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {formData.name || "—"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Email
                    </p>
                    <p
                      className={`text-sm ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {formData.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      User Type
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        formData.userType === "main-user"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                      }`}
                    >
                      {formData.userType === "main-user"
                        ? "Main User"
                        : "Sub User"}
                    </span>
                  </div>

                  <div>
                    <p
                      className={`text-xs mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Role
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        formData.role === "admin"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : formData.role === "teacher"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {formData.role}
                    </span>
                  </div>

                  {formData.userType === "sub-user" && (
                    <div>
                      <p
                        className={`text-xs mb-2 ${
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }`}
                      >
                        Permissions
                      </p>
                      <p
                        className={`text-sm font-semibold ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {selectedPermissions.length} route
                        {selectedPermissions.length !== 1 ? "s" : ""} selected
                      </p>
                      {selectedPermissions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {selectedPermissions.slice(0, 3).map((permId) => {
                            const route = AVAILABLE_ROUTES.find(
                              (r) => r.id === permId
                            );
                            return route ? (
                              <p
                                key={permId}
                                className={`text-xs ${
                                  isDarkMode ? "text-gray-400" : "text-gray-600"
                                }`}
                              >
                                • {route.name}
                              </p>
                            ) : null;
                          })}
                          {selectedPermissions.length > 3 && (
                            <p
                              className={`text-xs ${
                                isDarkMode ? "text-gray-500" : "text-gray-500"
                              }`}
                            >
                              +{selectedPermissions.length - 3} more
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNewUserForm;
