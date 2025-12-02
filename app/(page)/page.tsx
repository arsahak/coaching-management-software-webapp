import { auth } from "@/auth";
import Dashboard from "@/component/dashboard/Dashboard";

const page = async () => {
  const session = await auth();

  return (
    <div>
      <Dashboard session={session?.user?.name ?? undefined} />
    </div>
  );
};

export default page;
