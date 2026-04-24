import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Settings } from "lucide-react";
import { getApplicationState } from "@/lib/system-settings";
import { ApplicationWindowControls } from "./application-window-controls";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") redirect("/dashboard");

  const state = await getApplicationState();

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
        <div className="max-w-3xl space-y-5">
          <ApplicationWindowControls
            initial={{
              applicationsOpen: state.applicationsOpen,
              applicationsOpensAt: state.applicationsOpensAt?.toISOString() ?? null,
              applicationsClosesAt: state.applicationsClosesAt?.toISOString() ?? null,
              applicationsClosedNote: state.applicationsClosedNote,
              isAcceptingApplications: state.isAcceptingApplications,
              reason: state.reason,
            }}
          />

          <Card variant="glass">
            <CardContent>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Settings className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Your account
                  </h3>
                  <p className="text-xs text-muted">
                    Admin profile details
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted mb-1">Admin email</p>
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
      </div>
    </>
  );
}
