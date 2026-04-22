import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// /ops is the operations console. Only ADMIN / SUPER_ADMIN. The path is
// deliberately not named /admin so it is less discoverable from the outside.
export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }
  return <div className="min-h-screen bg-background">{children}</div>;
}
