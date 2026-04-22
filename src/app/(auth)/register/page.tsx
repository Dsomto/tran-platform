import { redirect } from "next/navigation";

// Self-service registration is intentionally disabled.
// Participants are registered by the admin team after application review.
// Anyone landing on /register is redirected to /apply.
export default function RegisterPage() {
  redirect("/apply");
}
