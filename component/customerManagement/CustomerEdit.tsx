"use client";
import { Customer, updateCustomer } from "@/app/actions/customer";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import CustomerForm, { CustomerFormData } from "./CustomerForm";

interface CustomerEditProps {
  customer: Customer;
}

const CustomerEdit = ({ customer }: CustomerEditProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map Customer to CustomerFormData
  const initialData: CustomerFormData = {
    name: customer.name,
    email: customer.email,
    phone: customer.phone || "",
  };

  const handleSubmit = async (data: CustomerFormData) => {
    setIsSubmitting(true);
    
    try {
        const response = await updateCustomer(customer._id, data);

        if (response.success) {
            toast.success("Customer updated successfully!");
            router.push("/customers");
            router.refresh();
        } else {
            toast.error(response.error || "Failed to update customer");
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
      title="Edit Customer"
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      isEdit={true}
    />
  );
};

export default CustomerEdit;
