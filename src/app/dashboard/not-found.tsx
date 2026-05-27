import Link from "next/link";

// Easter egg #13: intern-scoped 404. Cosmetic only.
export default function DashboardNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-10 text-center">
      <p className="font-mono text-5xl font-bold text-blue">404</p>
      <p className="font-mono text-sm text-muted-foreground">This route has left the chat logs.</p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg bg-blue px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
