"use client";
import { createCustomer } from "@/app/actions/customer";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import CustomerForm, { CustomerFormData } from "./CustomerForm";

const CustomerAdd = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    
    try {
        const response = await createCustomer(data);

        if (response.success) {
            toast.success("Customer created successfully!");
            router.push("/customers");
            router.refresh();
        } else {
            toast.error(response.error || "Failed to create customer");
        }
    } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <CustomerForm
      title="Add New Customer"
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
    />
  );
};

export default CustomerAdd;
