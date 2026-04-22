import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Return 404 — not a /login redirect — for anyone not already privileged.
  // This prevents external scanners from discovering /admin by watching for
  // auth redirects. The path looks exactly like a non-existent route.
  if (!session) {
    notFound();
  }

  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "GRADER") {
    notFound();
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role={session.role}
        userName={`${session.firstName} ${session.lastName}`}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
