"use client";
import { getSubUsers, updateSubUser, updateUserPermissions } from "@/app/actions/userManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  MdArrowBack,
  MdCheckCircle,
  MdEdit,
  MdImage,
  MdLock,
  MdPerson,
  MdSave,
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

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  userType?: string;
  avatar?: string;
  permissions?: string[];
}

const EditUserForm = () => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "teacher",
    avatar: "",
  });
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const result = await getSubUsers();
      if (result.success && result.data && Array.isArray(result.data)) {
        const foundUser = result.data.find((u: User) => u._id === userId);
        if (foundUser) {
          setUser(foundUser);
          setFormData({
            name: foundUser.name,
            email: foundUser.email,
            password: "",
            role: foundUser.role,
            avatar: foundUser.avatar || "",
          });
          setSelectedPermissions(foundUser.permissions || []);
        } else {
          toast.error("User not found");
          router.push("/settings");
        }
      } else {
        toast.error("Failed to load user data");
        router.push("/settings");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error("Failed to load user data");
      router.push("/settings");
    } finally {
      setLoading(false);
    }
  };

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

    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PNG, JPG, or WEBP image");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const base64Image = await convertFileToBase64(file);
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
    if (!userId) return;

    setSaving(true);
    try {
      // Update user basic info
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };
      
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }
      
      if (formData.avatar) {
        updateData.avatar = formData.avatar;
      }

      const result = await updateSubUser(userId, updateData);
      
      if (result.success) {
        // Update permissions separately
        const permResult = await updateUserPermissions(userId, selectedPermissions);
        
        if (permResult.success) {
          toast.success("User updated successfully!");
          router.push("/settings");
        } else {
          toast.error(permResult.error || "Failed to update permissions");
        }
      } else {
        toast.error(result.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

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
              <MdEdit
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
                Edit User
              </h1>
              <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                Update user account information, role, and permissions
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
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
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

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
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      New Password (leave empty to keep current)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={6}
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>

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
                      required
                      className={`w-full px-4 py-3 rounded-lg border-2 focus:ring-2 focus:ring-indigo-500 ${
                        isDarkMode
                          ? "bg-gray-700 border-gray-600 text-gray-100"
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="teacher">Teacher</option>
                      <option value="student">Student</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label
                      className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Avatar
                    </label>
                    <div className="flex items-center gap-4">
                      {formData.avatar && (
                        <img
                          src={formData.avatar}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                        />
                      )}
                      <label
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                          uploadingAvatar
                            ? "opacity-50 cursor-not-allowed"
                            : isDarkMode
                            ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                        }`}
                      >
                        <MdImage className="text-xl" />
                        {uploadingAvatar ? "Uploading..." : "Upload Avatar"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={handleAvatarUpload}
                          disabled={uploadingAvatar}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Permissions Section */}
              <div
                className={`rounded-lg border-2 p-6 ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center gap-2 mb-6">
                  <MdLock className="text-2xl text-indigo-500" />
                  <h2
                    className={`text-xl font-bold ${
                      isDarkMode ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Route Permissions
                  </h2>
                </div>

                <p
                  className={`text-sm mb-4 ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Select which routes this user can access:
                </p>

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {AVAILABLE_ROUTES.map((route) => {
                    const hasPermission = selectedPermissions.includes(route.id);
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
                            <div className="w-5 h-5 rounded-full border-2 border-gray-400 shrink-0 mt-0.5" />
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
                              className={`text-sm ${
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
                              Route: {route.route}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Preview Sidebar */}
            <div className="lg:col-span-1">
              <div
                className={`sticky top-6 rounded-lg border-2 p-6 ${
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
                      <img
                        src={formData.avatar}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                      />
                    </div>
                  )}

                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Name
                    </p>
                    <p
                      className={`text-lg font-semibold ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {formData.name || "Not set"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Email
                    </p>
                    <p
                      className={`text-lg ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      {formData.email || "Not set"}
                    </p>
                  </div>

                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Role
                    </p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                        formData.role === "admin"
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                          : formData.role === "teacher"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {formData.role}
                    </span>
                  </div>

                  <div>
                    <p
                      className={`text-sm font-medium mb-2 ${
                        isDarkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Permissions ({selectedPermissions.length})
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {selectedPermissions.length > 0 ? (
                        selectedPermissions.map((permId) => {
                          const route = AVAILABLE_ROUTES.find(
                            (r) => r.id === permId
                          );
                          return (
                            <div
                              key={permId}
                              className={`p-2 rounded text-xs ${
                                isDarkMode
                                  ? "bg-indigo-900/30 text-indigo-300"
                                  : "bg-indigo-50 text-indigo-700"
                              }`}
                            >
                              {route?.name || permId}
                            </div>
                          );
                        })
                      ) : (
                        <p
                          className={`text-sm ${
                            isDarkMode ? "text-gray-500" : "text-gray-400"
                          }`}
                        >
                          No permissions selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-6 flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className={`px-6 py-3 rounded-lg border-2 ${
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
              className="flex-1 px-6 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
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
        </form>
      </div>
    </div>
  );
};

export default EditUserForm;
