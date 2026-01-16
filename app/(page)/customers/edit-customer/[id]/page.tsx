import { Customer, getCustomerById } from "@/app/actions/customer";
import CustomerEdit from "@/component/customerManagement/CustomerEdit";
import { redirect } from "next/navigation";

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const response = await getCustomerById(resolvedParams.id);
  
  if (!response.success || !response.data) {
      redirect("/customers");
  }

  return <CustomerEdit customer={response.data as Customer} />;
}
