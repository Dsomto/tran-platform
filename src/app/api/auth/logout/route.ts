import { cookies } from "next/headers";
import { sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  // Domain-scoped delete (the one set by current login flow). Browsers only
  // remove a cookie when the Set-Cookie attributes — including Domain —
  // match the existing one, so this delete and the host-only delete below
  // each target a separate cookie that may exist on the user's browser.
  cookieStore.set("session-token", "", sessionCookieOptions(0));
  // Host-only delete — cleans up any leftover cookie issued before the
  // domain attribute was added. Safe to remove once everyone has cycled
  // through a fresh login.
  cookieStore.set("session-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return Response.json({ success: true });
}
