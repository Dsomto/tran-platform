import { NextRequest } from "next/server";
import { login } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier: string | undefined = body.identifier ?? body.email;
    const password: string | undefined = body.password;

    if (!identifier || !password) {
      return Response.json(
        { error: "Email (or intern ID) and password are required" },
        { status: 400 }
      );
    }

    const result = await login(identifier, password);

    if (!result) {
      return Response.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();
    cookieStore.set("session-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return Response.json({ user: result.user });
  } catch (error) {
    console.error("Login error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
