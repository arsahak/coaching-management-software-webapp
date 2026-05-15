import { getInquiries, getInquiryStats } from "@/app/actions/inquiry";
import InquiryManagement from "@/component/inquiryManagement/InquiryManagement";
import type { InquiryStatus } from "@/app/actions/inquiry";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admission Inquiries | Coaching Center",
  description: "Website admission inquiry submissions",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
  }>;
}

export default async function AdmissionInquiryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = parseInt(params.limit || "10", 10);
  const search = params.search || "";
  const status = (params.status || "") as InquiryStatus | "";

  const [inquiriesResult, statsResult] = await Promise.all([
    getInquiries(page, limit, search, status || undefined),
    getInquiryStats(),
  ]);

  const initialData = Array.isArray(inquiriesResult.data)
    ? inquiriesResult.data
    : [];

  return (
    <InquiryManagement
      initialData={initialData}
      initialPagination={inquiriesResult.pagination}
      initialSearch={search}
      initialStatus={status}
      initialStats={statsResult.data}
    />
  );
}
