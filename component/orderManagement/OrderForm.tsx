"use client";
import { Customer } from "@/app/actions/customer";
import { Product } from "@/app/actions/product";
import { useSidebar } from "@/lib/SidebarContext";
import { useState } from "react";
import { FaMinus, FaPlus, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation";

export interface OrderItemInput {
  product: string; // Product ID
  quantity: number;
}

export interface OrderFormData {
  customer: string; // Customer ID
  items: OrderItemInput[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: string;
  customerNote: string;
  orderStatus: string;
}

interface OrderFormProps {
  initialData?: OrderFormData;
  onSubmit: (data: OrderFormData) => void;
  title: string;
  isSubmitting?: boolean;
  customersList: Customer[];
  productsList: Product[];
  isEdit?: boolean;
}

const OrderForm = ({
  initialData,
  onSubmit,
  title,
  isSubmitting = false,
  customersList = [],
  productsList = [],
  isEdit = false,
}: OrderFormProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();

  const [formData, setFormData] = useState<OrderFormData>(
    initialData || {
      customer: "",
      items: [{ product: "", quantity: 1 }],
      shippingAddress: {
        fullName: "",
        phone: "",
        addressLine1: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Bangladesh",
      },
      paymentMethod: "cash_on_delivery",
      customerNote: "",
      orderStatus: "pending",
    }
  );

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [name]: value,
      },
    }));
  };

  const handleItemChange = (index: number, field: keyof OrderItemInput, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { product: "", quantity: 1 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
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
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">{title}</h1>
          <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
            {isEdit ? "Update order details" : "Create a new order"}
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
            <FaSave /> {isSubmitting ? "Saving..." : "Save Order"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Order Items</h2>
              {!isEdit && (
                  <button type="button" onClick={addItem} className="text-blue-500 hover:text-blue-600 text-sm font-semibold flex items-center gap-1">
                    <FaPlus /> Add Item
                  </button>
              )}
            </div>
            {isEdit ? (
                <p className="text-sm text-gray-500">Items cannot be edited directly. Please cancel and re-create if needed.</p>
            ) : (
                <div className="space-y-4">
                {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className={labelClass}>Product</label>
                        <select
                        value={item.product}
                        onChange={(e) => handleItemChange(index, "product", e.target.value)}
                        className={inputClass}
                        required
                        >
                        <option value="">Select Product</option>
                        {productsList.map((p) => (
                            <option key={p._id} value={p._id}>
                            {p.name} (${p.price}) - Stock: {p.stock}
                            </option>
                        ))}
                        </select>
                    </div>
                    <div className="w-24">
                        <label className={labelClass}>Qty</label>
                        <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseInt(e.target.value))}
                        className={inputClass}
                        required
                        />
                    </div>
                    <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-3 text-red-500 hover:bg-red-50 rounded-lg"
                        disabled={formData.items.length === 1}
                    >
                        <FaTrash />
                    </button>
                    </div>
                ))}
                </div>
            )}
          </div>

          {/* Shipping Address */}
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input type="text" name="fullName" value={formData.shippingAddress.fullName} onChange={handleAddressChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Phone</label>
                <input type="text" name="phone" value={formData.shippingAddress.phone} onChange={handleAddressChange} className={inputClass} required />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Address Line 1</label>
                <input type="text" name="addressLine1" value={formData.shippingAddress.addressLine1} onChange={handleAddressChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>City</label>
                <input type="text" name="city" value={formData.shippingAddress.city} onChange={handleAddressChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>State</label>
                <input type="text" name="state" value={formData.shippingAddress.state} onChange={handleAddressChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Zip Code</label>
                <input type="text" name="zipCode" value={formData.shippingAddress.zipCode} onChange={handleAddressChange} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Country</label>
                <input type="text" name="country" value={formData.shippingAddress.country} onChange={handleAddressChange} className={inputClass} required />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Customer Selection */}
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Customer</h2>
            {isEdit ? (
                 <p className="text-sm text-gray-500">Customer cannot be changed.</p>
            ) : (
                <select
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                className={inputClass}
                required
                >
                <option value="">Select Customer</option>
                {customersList.map((c) => (
                    <option key={c._id} value={c._id}>
                    {c.name} ({c.email})
                    </option>
                ))}
                </select>
            )}
          </div>

          {/* Payment & Status */}
          <div className={`p-6 rounded-lg border ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className={inputClass}
                >
                  <option value="cash_on_delivery">Cash on Delivery</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_payment">Mobile Payment</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Order Status</label>
                <select
                  value={formData.orderStatus}
                  onChange={(e) => setFormData({ ...formData, orderStatus: e.target.value })}
                  className={inputClass}
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Note</label>
                <textarea
                  value={formData.customerNote}
                  onChange={(e) => setFormData({ ...formData, customerNote: e.target.value })}
                  className={`${inputClass} h-24`}
                  placeholder="Customer note..."
                />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
