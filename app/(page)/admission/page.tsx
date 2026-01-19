import { getAdmissions } from "@/app/actions/admission";
import AdmissionManagement from "@/component/admission/AdmissionManagement";

export const metadata = {
  title: "Admission Management | Coaching Center",
  description: "Manage student admissions",
};

interface AdmissionPageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    class?: string;
    batch?: string;
    status?: string;
  }>;
}

export default async function AdmissionPage({
  searchParams,
}: AdmissionPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "10");
  const search = params.search || "";
  const classFilter = params.class || "";
  const batchFilter = params.batch || "";
  const statusFilter = params.status || "";

  // Fetch admissions with SSR
  const admissionsResult = await getAdmissions(page, limit, search, {
    class: classFilter || undefined,
    batch: batchFilter || undefined,
    status: statusFilter || undefined,
  });

  // Ensure data is an array
  const initialData = Array.isArray(admissionsResult.data)
    ? admissionsResult.data
    : [];

  return (
    <AdmissionManagement
      initialData={initialData}
      initialPagination={admissionsResult.pagination}
      initialSearch={search}
      initialFilters={{
        class: classFilter,
        batch: batchFilter,
        status: statusFilter,
      }}
    />
  );
}
