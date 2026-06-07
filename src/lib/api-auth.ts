import { getSession, type SessionUser } from "./auth";

type Role = SessionUser["role"];

type ApiAuthResult =
  | { session: SessionUser; response: null }
  | { session: null; response: Response };

async function requireApiRoles(roles: readonly Role[]): Promise<ApiAuthResult> {
  const session = await getSession();
  if (!session) {
    return {
      session: null,
      response: Response.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!roles.includes(session.role)) {
    return {
      session: null,
      response: Response.json({ error: "Not found" }, { status: 404 }),
    };
  }
  return { session, response: null };
}

export function requireApiAdmin() {
  return requireApiRoles(["ADMIN", "SUPER_ADMIN"]);
}

export function requireApiSuperAdmin() {
  return requireApiRoles(["SUPER_ADMIN"]);
}

export function requireApiGrader() {
  return requireApiRoles(["GRADER", "ADMIN", "SUPER_ADMIN"]);
}
