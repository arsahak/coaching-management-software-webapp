import { auth } from "@/auth";
import Dashboard from "@/component/dashboard/Dashboard";

export const dynamic = "force-dynamic";

const page = async () => {
  const session = await auth();

  return (
    <div>
      <Dashboard session={session?.user?.name ?? undefined} />
    </div>
  );
};

export default page;
