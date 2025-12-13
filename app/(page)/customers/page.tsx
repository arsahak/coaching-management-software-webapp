import { Customer, getCustomers } from "@/app/actions/customer";
import CustomerManagement from "@/component/customerManagement/CustomerManagement";

const CustomersPage = async () => {
  const response = await getCustomers(1, 20); // Default page 1, limit 20

  const initialCustomers = (response.success && response.data ? response.data : []) as Customer[];
  const pagination = response.pagination;

  return <CustomerManagement initialCustomers={initialCustomers} pagination={pagination} />;
};

export default CustomersPage;