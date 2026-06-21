import { requireSuperAdmin } from "@/lib/auth";
import { Stage2ResubmitClient } from "./resubmit-client";

// Stage 2 "could not open your capstone" re-share sender. The send itself is
// locked to the authorised email + 2FA by the API route; this page is the
// composer. Recipients are pasted in (not stored in the repo).
export default async function Stage2ResubmitPage() {
  await requireSuperAdmin();
  return <Stage2ResubmitClient />;
}
