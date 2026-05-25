import BulkSMSManagement from "@/component/bluksmsManagement/BulkSMSManagement";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bulk SMS Management | Coaching Center",
  description: "Send bulk SMS and manage SMS history",
};

export default function BulkSMSPage() {
  return <BulkSMSManagement />;
}
