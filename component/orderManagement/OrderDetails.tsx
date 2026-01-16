"use client";
import { Order, updateOrderStatus } from "@/app/actions/order";
import { useSidebar } from "@/lib/SidebarContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaArrowLeft, FaBox, FaCreditCard, FaEdit, FaShippingFast, FaUser } from "react-icons/fa";

interface OrderDetailsProps {
  order: Order;
}

const OrderDetails = ({ order }: OrderDetailsProps) => {
  const { isDarkMode } = useSidebar();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      setIsUpdating(true);
      try {
        const response = await updateOrderStatus(order._id, { orderStatus: newStatus });
        if (response.success) {
          toast.success(`Order status updated to ${newStatus}`);
          router.refresh();
        } else {
          toast.error(response.error || "Failed to update status");
        }
      } catch (error) {
        toast.error("An error occurred");
      } finally {
        setIsUpdating(false);
      }
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      refunded: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <div
      className={`min-h-screen p-6 ${
        isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Order Details</h1>
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg text-gray-500">#{order.orderNumber}</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.orderStatus)}`}>
              {order.orderStatus.toUpperCase()}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
              isDarkMode
                ? "border-gray-700 text-gray-300 hover:bg-gray-800"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FaArrowLeft /> Back
          </button>
          
          <Link
            href={`/orders/edit-order/${order._id}`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaEdit /> Edit Order
          </Link>

          {/* Status Actions */}
          {order.orderStatus === 'pending' && (
             <button
                onClick={() => handleStatusChange('processing')}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
             >
                Mark as Processing
             </button>
          )}
          {order.orderStatus === 'processing' && (
             <button
                onClick={() => handleStatusChange('shipped')}
                disabled={isUpdating}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
             >
                Mark as Shipped
             </button>
          )}
          {order.orderStatus === 'shipped' && (
             <button
                onClick={() => handleStatusChange('delivered')}
                disabled={isUpdating}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
             >
                Mark as Delivered
             </button>
          )}
          {(order.orderStatus === 'pending' || order.orderStatus === 'processing') && (
             <button
                onClick={() => handleStatusChange('cancelled')}
                disabled={isUpdating}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
             >
                Cancel Order
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className={`rounded-lg border overflow-hidden ${
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold flex items-center gap-2">
                    <FaBox className="text-gray-400"/> Order Items
                </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {order.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center gap-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            {item.product?.images?.[0]?.url && (
                                <img src={item.product.images[0].url} alt={item.productName} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h4 className="font-medium">{item.productName}</h4>
                            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                                SKU: {item.sku}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="font-medium">{formatCurrency(item.price)} x {item.quantity}</p>
                            <p className="font-bold">{formatCurrency(item.total)}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(order.total)}</span>
                </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
            {/* Customer Info */}
            <div className={`p-6 rounded-lg border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FaUser className="text-gray-400"/> Customer
                </h3>
                <div className="space-y-2 text-sm">
                    <p className="font-medium">{order.customerName}</p>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{order.customerEmail}</p>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>{order.customerPhone}</p>
                </div>
            </div>

            {/* Shipping Info */}
            <div className={`p-6 rounded-lg border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FaShippingFast className="text-gray-400"/> Shipping Address
                </h3>
                <div className={`text-sm space-y-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                    <p>{order.shippingAddress?.fullName}</p>
                    <p>{order.shippingAddress?.addressLine1}</p>
                    {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress?.addressLine2}</p>}
                    <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
                    <p>{order.shippingAddress?.country}</p>
                </div>
            </div>

            {/* Payment Info */}
            <div className={`p-6 rounded-lg border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
            }`}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <FaCreditCard className="text-gray-400"/> Payment
                </h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Method</span>
                        <span className="capitalize">{order.paymentInfo?.method?.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className={isDarkMode ? "text-gray-400" : "text-gray-600"}>Status</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            order.paymentInfo?.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                            {order.paymentInfo?.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;