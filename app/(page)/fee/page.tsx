import TuitionFeeManagement from "@/component/feeManagement/TuitionFeeManagement";
import { Suspense } from "react";

export const metadata = {
  title: "Tuition Fee Management | Coaching Center",
  description: "Manage monthly fee records, payments, and SMS notifications",
};

export default function FeePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TuitionFeeManagement />
    </Suspense>
  );
}
