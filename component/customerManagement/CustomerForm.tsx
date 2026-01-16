"use client";
import { useSidebar } from "@/lib/SidebarContext";
import { useState } from "react";
import { FaSave, FaTimes } from "react-icons/fa";
import { useRouter } from "next/navigation";

export interface CustomerFormData {
  name: string;
  email: string;
  phone?: string;
  password?: string; // Only for creation or password reset
}

interface CustomerFormProps {
  initialData?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => void;
  title: string;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

const CustomerForm = ({
  initialData,
  onSubmit,
  title,
  isSubmitting = false,
  isEdit = false,
}: CustomerFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();

  const [formData, setFormData] = useState<CustomerFormData>(
    initialData || {
      name: "",
      email: "",
      phone: "",
      password: "",
    }
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const inputClass = `w-full px-4 py-2 rounded-lg border ${
    isDarkMode
      ? "bg-gray-800 border-gray-700 text-gray-100"
      : "bg-white border-gray-300 text-gray-900"
  } focus:outline-none focus:ring-2 focus:ring-blue-500`;

  const labelClass = `block text-sm font-medium mb-1 ${
    isDarkMode ? "text-gray-400" : "text-gray-700"
  }`;

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {isEdit ? "Update customer details" : "Add a new customer to your store"}
          </p>
        </div>
        <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
                 isDarkMode
                  ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaTimes /> Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <FaSave /> {isSubmitting ? "Saving..." : "Save Customer"}
            </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">
              Account Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Email Address</label>
                    <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="john@example.com"
                    required
                    />
                </div>
                <div>
                    <label className={labelClass}>Phone Number</label>
                    <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="+1 (555) 000-0000"
                    />
                </div>
              </div>
              
              {!isEdit && (
                  <div>
                    <label className={labelClass}>Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="••••••••"
                      required={!isEdit}
                      minLength={6}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Must be at least 6 characters.
                    </p>
                  </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div
            className={`p-6 rounded-lg border ${
              isDarkMode
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">Notes</h2>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Customer addresses and orders can be managed after creating the account.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
