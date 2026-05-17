import { requireSuperAdmin } from "@/lib/auth";
import { BroadcastClient } from "./broadcast-client";

// Newsletter sender — super-admin only. A core admin who reaches this URL is
// bounced to /admin by requireSuperAdmin().
export default async function NewsletterPage() {
  await requireSuperAdmin();
  return <BroadcastClient />;
}
