"use client";
import {
  deleteSubUser,
  getSubUsers,
  SubUser,
  updateUserPermissions,
} from "@/app/actions/userManagement";
import { useSidebar } from "@/lib/SidebarContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  MdAdd,
  MdArrowBack,
  MdCancel,
  MdCheckCircle,
  MdDelete,
  MdEdit,
  MdLock,
  MdPeople,
  MdSave,
} from "react-icons/md";

interface RoutePermission {
  id: string;
  name: string;
  description: string;
  route: string;
}

const AVAILABLE_ROUTES: RoutePermission[] = [
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

const UserManagement = () => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<SubUser[]>([]);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SubUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await getSubUsers();
      if (result.success && result.data) {
        // Ensure data is an array
        const usersData = Array.isArray(result.data)
          ? result.data
          : [result.data];
        setUsers(usersData);
      } else {
        toast.error(result.error || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch users";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    router.push("/settings/add-user");
  };

  const handleEditUser = (user: SubUser) => {
    router.push(`/settings/edit?id=${user._id}`);
  };

  const handleManagePermissions = (user: SubUser) => {
    setSelectedUser(user);
    setUserPermissions(user.permissions || []);
    setShowPermissionsModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setSaving(true);
    try {
      const result = await deleteSubUser(userId);
      if (result.success) {
        toast.success("User deleted successfully!");
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;

    setSaving(true);
    try {
      const result = await updateUserPermissions(
        selectedUser._id,
        userPermissions
      );
      if (result.success) {
        toast.success("Permissions updated successfully!");
        setShowPermissionsModal(false);
        setSelectedUser(null);
        fetchUsers();
      } else {
        toast.error(result.error || "Failed to update permissions");
      }
    } catch (error) {
      console.error("Error updating permissions:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update permissions";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (routeId: string) => {
    setUserPermissions((prev) =>
      prev.includes(routeId)
        ? prev.filter((id) => id !== routeId)
        : [...prev, routeId]
    );
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
        Back to Settings
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className={`text-3xl font-bold mb-2 ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            User Management
          </h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            Manage sub-users and their route access permissions
          </p>
        </div>
        <button
          onClick={handleAddUser}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          <MdAdd className="text-xl" />
          Add User
        </button>
      </div>

      {/* Users List */}
      <div
        className={`rounded-lg border-2 p-6 ${
          isDarkMode
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center gap-2 mb-4">
          <MdPeople className="text-2xl text-indigo-500" />
          <h2
            className={`text-xl font-bold ${
              isDarkMode ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Sub-Users ({users.length})
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <MdPeople
              className={`text-6xl mx-auto mb-4 ${
                isDarkMode ? "text-gray-600" : "text-gray-300"
              }`}
            />
            <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
              No sub-users found. Click "Add User" to create one.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`border-b-2 ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <th
                    className={`text-left py-3 px-4 font-semibold ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Name
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-semibold ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Email
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-semibold ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Role
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-semibold ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Permissions
                  </th>
                  <th
                    className={`text-left py-3 px-4 font-semibold ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className={`border-b ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <p
                        className={`font-medium ${
                          isDarkMode ? "text-gray-100" : "text-gray-900"
                        }`}
                      >
                        {user.name}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p
                        className={
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }
                      >
                        {user.email}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                            : user.role === "teacher"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-sm ${
                          isDarkMode ? "text-gray-300" : "text-gray-700"
                        }`}
                      >
                        {user.permissions?.length || 0} routes
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleManagePermissions(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? "text-blue-400 hover:bg-gray-700"
                              : "text-blue-600 hover:bg-blue-50"
                          }`}
                          title="Manage Permissions"
                        >
                          <MdLock className="text-xl" />
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? "text-yellow-400 hover:bg-gray-700"
                              : "text-yellow-600 hover:bg-yellow-50"
                          }`}
                          title="Edit User"
                        >
                          <MdEdit className="text-xl" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? "text-red-400 hover:bg-gray-700"
                              : "text-red-600 hover:bg-red-50"
                          }`}
                          title="Delete User"
                        >
                          <MdDelete className="text-xl" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div
            className={`rounded-lg border-2 p-6 w-full max-w-2xl my-8 ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3
                className={`text-xl font-bold ${
                  isDarkMode ? "text-gray-100" : "text-gray-900"
                }`}
              >
                Manage Permissions - {selectedUser.name}
              </h3>
              <button
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                }}
                className={`p-2 rounded-lg ${
                  isDarkMode
                    ? "hover:bg-gray-700 text-gray-400"
                    : "hover:bg-gray-100 text-gray-600"
                }`}
              >
                <MdCancel className="text-xl" />
              </button>
            </div>

            <p
              className={`text-sm mb-6 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Select which routes this user can access:
            </p>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-6">
              {AVAILABLE_ROUTES.map((route) => {
                const hasPermission = userPermissions.includes(route.id);
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
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          {hasPermission ? (
                            <MdCheckCircle className="text-green-500 text-xl shrink-0" />
                          ) : (
                            <MdCancel className="text-gray-400 text-xl shrink-0" />
                          )}
                          <h4
                            className={`font-semibold ${
                              isDarkMode ? "text-gray-100" : "text-gray-900"
                            }`}
                          >
                            {route.name}
                          </h4>
                        </div>
                        <p
                          className={`text-sm ml-9 ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {route.description}
                        </p>
                        <p
                          className={`text-xs ml-9 mt-1 ${
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

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                  isDarkMode
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <MdSave />
                    Save Permissions
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
