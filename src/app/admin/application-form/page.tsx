import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Topbar } from "@/components/dashboard/topbar";
import { getApplicationState } from "@/lib/system-settings";
import { ApplicationWindowControls } from "@/app/admin/settings/application-window-controls";

// Dedicated tab for opening / closing the public application form. The
// control itself is the same one used on the Settings page — surfaced here
// on its own so it's easy to find.
export default async function ApplicationFormPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
    redirect("/dashboard");
  }

  const state = await getApplicationState();

  return (
    <>
      <Topbar
        title="Application Form"
        subtitle="Open or close the public application form"
        firstName={session.firstName}
        lastName={session.lastName}
        avatarUrl={session.avatarUrl}
      />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-3xl">
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
        </div>
      </div>
    </>
  );
}
