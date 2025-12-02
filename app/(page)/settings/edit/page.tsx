import EditUserForm from "@/component/settingsManagement/EditUserForm";
import { Suspense } from "react";

const EditUserPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditUserForm />
    </Suspense>
  );
};

export default EditUserPage;
