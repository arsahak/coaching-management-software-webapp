import { getAdmissionById } from "@/app/actions/admission";
import AdmissionFormPage from "@/component/admission/AdmissionFormPage";
import { notFound } from "next/navigation";

interface EditAdmissionPageProps {
  params: Promise<{
    id: string;
  }>;
}

interface Admission {
  _id?: string;
  studentName?: string;
  fatherName?: string;
  motherName?: string;
  schoolName?: string;
  fatherMobile?: string;
  motherMobile?: string;
  studentMobile?: string;
  class?: string;
  subjects?: string[];
  batchName?: string;
  batchTime?: string;
  admissionDate?: string;
  monthlyFee?: number;
  notes?: string;
}

export const metadata = {
  title: "Edit Admission | Coaching Center",
  description: "Edit student admission details",
};

export default async function EditAdmissionPage({
  params,
}: EditAdmissionPageProps) {
  // Await params for Next.js 15+
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const result = await getAdmissionById(id);

  if (!result.success || !result.data) {
    notFound();
  }

  // Handle array response (API might return array or single object)
  const admission = Array.isArray(result.data) ? result.data[0] : result.data;

  if (!admission) {
    notFound();
  }

  return <AdmissionFormPage admission={admission as Admission} />;
}
