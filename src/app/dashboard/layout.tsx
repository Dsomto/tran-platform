import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "ADMIN" || session.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        role="INTERN"
        userName={`${session.firstName} ${session.lastName}`}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {children}
      </main>
    </div>
  );
}
