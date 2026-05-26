import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getSession } from "@/lib/auth";
import { ChangePasswordForm } from "./change-password-form";

// Top-level page — sits OUTSIDE the dashboard layout so the dashboard's gates
// can redirect into it without looping. Anyone hitting it must be signed in.
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-border rounded-xl shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-3 mb-1">
          <KeyRound className="h-5 w-5 text-blue" />
          <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          For your security, please replace the temporary password we emailed you with one of your
          own. It must be at least 12 characters.
        </p>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
