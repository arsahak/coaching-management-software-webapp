import ExamManagement from "@/component/ExamManagement/ExamManagement";
import { Suspense } from "react";

export const metadata = {
  title: "Exam Management | Coaching Center",
  description: "Manage exam schedules, results, and SMS notifications",
};

export default function ExamPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExamManagement />
    </Suspense>
  );
}
