import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { getStaffDoc } from "@/content/staff-docs";
import { markdownToHtmlDocument } from "@/lib/markdown";

// Download a staff doc (grader rubric / PM SOP). Gated to logged-in staff
// (admin, super-admin, grader). ?format=md (default) or html.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await getSession();
  if (
    !session ||
    (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN" && session.role !== "GRADER")
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const doc = getStaffDoc(slug);
  if (!doc) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format") === "html" ? "html" : "md";
  const body = format === "html" ? markdownToHtmlDocument(doc.title, doc.markdown) : doc.markdown;
  const contentType = format === "html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";

  return new Response(body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${doc.filename}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
