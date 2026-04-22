import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";

// /ops is the operations console. Only ADMIN / SUPER_ADMIN.
// Returns 404 (never a /login redirect) for unprivileged visitors so the
// path doesn't leak its existence to external scanners.
export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) notFound();
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") notFound();
  return <div className="min-h-screen bg-background">{children}</div>;
}
