import { getSession } from "@/lib/auth";
import { canSendEmails } from "@/lib/email-permissions";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  return Response.json({
    user: session,
    permissions: {
      emailSendAllowed: canSendEmails(session.email),
    },
  });
}
