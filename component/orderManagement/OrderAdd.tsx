"use client";
import { Customer } from "@/app/actions/customer";
import { createOrder } from "@/app/actions/order";
import { Product } from "@/app/actions/product";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import OrderForm, { OrderFormData } from "./OrderForm";

interface OrderAddProps {
  customersList: Customer[];
  productsList: Product[];
}

const OrderAdd = ({ customersList, productsList }: OrderAddProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: OrderFormData) => {
    setIsSubmitting(true);
    
    try {
        const response = await createOrder(data);

        if (response.success) {
            toast.success("Order created successfully!");
            router.push("/orders");
            router.refresh();
        } else {
            toast.error(response.error || "Failed to create order");
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
      title="Create Order"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      customersList={customersList}
      productsList={productsList}
    />
  );
};

export default OrderAdd;
