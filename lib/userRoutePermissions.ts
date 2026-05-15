import { getTranslation } from "@/lib/translations";

export interface RoutePermission {
  id: string;
  name: string;
  description: string;
  route: string;
}

const ROUTE_CONFIG: Array<{
  id: string;
  nameKey: string;
  descKey: string;
  route: string;
}> = [
  { id: "admission", nameKey: "permAdmission", descKey: "permAdmissionDesc", route: "/admission" },
  { id: "student", nameKey: "permStudent", descKey: "permStudentDesc", route: "/student" },
  { id: "exam", nameKey: "permExam", descKey: "permExamDesc", route: "/exam" },
  { id: "fee", nameKey: "permFee", descKey: "permFeeDesc", route: "/fee" },
  { id: "attendance", nameKey: "permAttendance", descKey: "permAttendanceDesc", route: "/attendance" },
  { id: "course", nameKey: "permCourse", descKey: "permCourseDesc", route: "/course" },
  { id: "teacher", nameKey: "permTeacher", descKey: "permTeacherDesc", route: "/teacher" },
  { id: "report", nameKey: "permReport", descKey: "permReportDesc", route: "/report" },
  { id: "settings", nameKey: "permSettings", descKey: "permSettingsDesc", route: "/settings" },
  { id: "add-user", nameKey: "permAddUser", descKey: "permAddUserDesc", route: "/settings/add-user" },
];

export function getAvailableRoutes(language: string): RoutePermission[] {
  return ROUTE_CONFIG.map(({ id, nameKey, descKey, route }) => ({
    id,
    name: getTranslation(nameKey, language),
    description: getTranslation(descKey, language),
    route,
  }));
}
