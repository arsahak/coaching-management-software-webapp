"use client";
import { Customer } from "@/app/actions/customer";
import { Order, updateOrder } from "@/app/actions/order";
import { Product } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import OrderForm, { OrderFormData } from "./OrderForm";

interface OrderEditProps {
  order: Order;
  customersList: Customer[];
  productsList: Product[];
}

const OrderEdit = ({ order, customersList, productsList }: OrderEditProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map Order to OrderFormData
  const initialData: OrderFormData = {
    customer: order.customer._id,
    items: order.items.map(item => ({
        product: item.product._id,
        quantity: item.quantity
    })),
    shippingAddress: {
        fullName: order.shippingAddress?.fullName || "",
        phone: order.shippingAddress?.phone || "",
        addressLine1: order.shippingAddress?.addressLine1 || "",
        city: order.shippingAddress?.city || "",
        state: order.shippingAddress?.state || "",
        zipCode: order.shippingAddress?.zipCode || "",
        country: order.shippingAddress?.country || "Bangladesh",
    },
    paymentMethod: order.paymentInfo?.method || "cash_on_delivery",
    customerNote: "", // Note: Backend Order model has customerNote, but interface might miss it. Assuming it's there or empty.
    orderStatus: order.orderStatus,
  };

  const handleSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    
    try {
        const response = await updateOrder(order._id, data);

        if (response.success) {
            toast.success("Order updated successfully!");
            router.push("/orders");
            router.refresh();
        } else {
            toast.error(response.error || "Failed to update order");
        }
    } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <OrderForm
      title="Edit Order"
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      customersList={customersList}
      productsList={productsList}
      isEdit={true}
    />
  );
};

export default OrderEdit;
