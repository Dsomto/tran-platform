import { requireSuperAdmin } from "@/lib/auth";
import { ProvisionPanel } from "./provision-panel";

export default async function ProvisionPage() {
  await requireSuperAdmin();
  return <ProvisionPanel />;
}
