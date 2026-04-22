import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const {
      whyJoin,
      experience,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      preferredTrack,
      hoursPerWeek,
      country,
      timezone,
      referralSource,
    } = body;

    if (!whyJoin || !experience || !preferredTrack || !hoursPerWeek || !country || !timezone) {
      return Response.json(
        { error: "Required fields are missing" },
        { status: 400 }
      );
    }

    // Check if user already has an application
    const existing = await prisma.application.findUnique({
      where: { userId: session.id },
    });

    if (existing) {
      return Response.json(
        { error: "You have already submitted an application" },
        { status: 409 }
      );
    }

    const application = await prisma.application.create({
      data: {
        userId: session.id,
        whyJoin,
        experience,
        portfolioUrl: portfolioUrl || null,
        githubUrl: githubUrl || null,
        linkedinUrl: linkedinUrl || null,
        preferredTrack,
        hoursPerWeek: parseInt(hoursPerWeek),
        country,
        timezone,
        referralSource: referralSource || null,
      },
    });

    return Response.json({ application }, { status: 201 });
  } catch (error) {
    console.error("Application error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return Response.json({ error: "Not authenticated" }, { status: 401 });
    }

    if (session.role !== "ADMIN" && session.role !== "SUPER_ADMIN") {
      return Response.json({ error: "Not authorized" }, { status: 403 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    const where = status ? { status: status as "PENDING" | "APPROVED" | "REJECTED" } : {};

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return Response.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get applications error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
