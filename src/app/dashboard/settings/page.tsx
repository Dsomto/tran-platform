import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Topbar
        title="Settings"
        subtitle="Manage your account"
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
                  Account Settings
                </h3>
                <p className="text-xs text-muted">
                  Update your profile and preferences
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-muted mb-1">First Name</p>
                  <p className="text-sm text-foreground">{session.firstName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted mb-1">Last Name</p>
                  <p className="text-sm text-foreground">{session.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1">Email</p>
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
