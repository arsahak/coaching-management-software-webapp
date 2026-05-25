import SigninPage from "@/component/auth/SigninPage";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

const page = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SigninPage />
    </Suspense>
  );
};

export default page;
