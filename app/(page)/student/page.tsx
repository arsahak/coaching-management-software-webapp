import StudentAttendanceManagement from "@/component/studentManagement/StudentAttendanceManagement";
import { Suspense } from "react";

export const metadata = {
  title: "Student Attendance | Coaching Center",
  description: "Manage student attendance records",
};

export default function StudentPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentAttendanceManagement />
    </Suspense>
  );
}
