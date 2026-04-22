import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const intern = await prisma.intern.findUnique({
      where: { userId: session.id },
    });

    if (!intern) {
      return Response.json({ error: "Intern profile not found" }, { status: 404 });
    }

    const { content, rating } = await request.json();

    if (!content) {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        internId: intern.id,
        content,
        rating: rating || 5,
      },
    });

    return Response.json({ testimonial }, { status: 201 });
  } catch (error) {
    console.error("Testimonial error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
