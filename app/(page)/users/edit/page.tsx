import EditUserForm from "@/component/userManagement/EditUserForm";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const EditUserPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditUserForm />
    </Suspense>
  );
};

export default EditUserPage;
