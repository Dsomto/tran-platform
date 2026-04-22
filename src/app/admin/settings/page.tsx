import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Admin configuration"
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <Card variant="glass" className="max-w-2xl">
          <CardContent>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Admin Settings
                </h3>
                <p className="text-xs text-muted">
                  System configuration and admin profile
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted mb-1">Admin Email</p>
                <p className="text-sm text-foreground">{session.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1">Role</p>
                <p className="text-sm text-foreground capitalize">
                  {session.role.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
