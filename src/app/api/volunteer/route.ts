import { NextRequest } from "next/server";
import { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { rateLimit, rateLimitResponse, getClientKey, RATE_LIMITS } from "@/lib/rate-limit";
import {
  VOLUNTEER_COHORT,
  volunteerDepartmentIds,
} from "@/lib/volunteer-departments";
import {
  renderVolunteerApplicationConfirmation,
  sendVolunteerApplicationConfirmation,
} from "@/lib/email";

const MAX_LENGTHS = {
  fullName: 120,
  email: 200,
  phone: 40,
  country: 100,
  city: 100,
  timeZone: 80,
  currentRole: 160,
  organisation: 180,
  ubiRelationship: 60,
  weeklyAvailability: 40,
  linkedinUrl: 500,
  portfolioUrl: 500,
  experienceSummary: 1800,
  motivation: 1400,
  contributionPlan: 1400,
  relevantExample: 1400,
  referralSource: 300,
  conflictDisclosure: 1000,
} as const;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown) {
  const normalized = text(value);
  return normalized || null;
}

function validUrl(value: string | null) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimit(getClientKey(request), RATE_LIMITS.apply);
    if (!rl.ok) return rateLimitResponse(rl);

    const body = await request.json();
    if (text(body.website)) return Response.json({ success: true }, { status: 201 });

    const fullName = text(body.fullName);
    const email = text(body.email).toLowerCase();
    const phone = text(body.phone);
    const country = text(body.country);
    const city = optionalText(body.city);
    const timeZone = text(body.timeZone);
    const currentRole = text(body.currentRole);
    const organisation = optionalText(body.organisation);
    const ubiRelationship = text(body.ubiRelationship);
    const primaryDepartment = text(body.primaryDepartment);
    const secondaryDepartment = optionalText(body.secondaryDepartment);
    const weeklyAvailability = text(body.weeklyAvailability);
    const linkedinUrl = optionalText(body.linkedinUrl);
    const portfolioUrl = optionalText(body.portfolioUrl);
    const experienceSummary = text(body.experienceSummary);
    const motivation = text(body.motivation);
    const contributionPlan = text(body.contributionPlan);
    const relevantExample = text(body.relevantExample);
    const referralSource = optionalText(body.referralSource);
    const conflictDisclosure = optionalText(body.conflictDisclosure);

    const required = {
      fullName,
      email,
      phone,
      country,
      timeZone,
      currentRole,
      ubiRelationship,
      primaryDepartment,
      weeklyAvailability,
      experienceSummary,
      motivation,
      contributionPlan,
      relevantExample,
    };
    if (Object.values(required).some((value) => !value)) {
      return Response.json({ error: "Please complete every required field." }, { status: 400 });
    }
    if (body.commitmentAccepted !== true || body.conductAccepted !== true) {
      return Response.json(
        { error: "Please confirm the volunteer commitment and code of conduct." },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!/^\+?[0-9()\-\s]{7,40}$/.test(phone)) {
      return Response.json({ error: "Please enter a valid phone number with country code." }, { status: 400 });
    }
    if (!volunteerDepartmentIds.has(primaryDepartment)) {
      return Response.json({ error: "Select a valid primary department." }, { status: 400 });
    }
    if (secondaryDepartment && !volunteerDepartmentIds.has(secondaryDepartment)) {
      return Response.json({ error: "Select a valid secondary department." }, { status: 400 });
    }
    if (secondaryDepartment === primaryDepartment) {
      return Response.json({ error: "Your secondary department must be different." }, { status: 400 });
    }
    if (!validUrl(linkedinUrl) || !validUrl(portfolioUrl)) {
      return Response.json({ error: "LinkedIn and portfolio links must be valid web addresses." }, { status: 400 });
    }

    const fields = {
      fullName,
      email,
      phone,
      country,
      city: city ?? "",
      timeZone,
      currentRole,
      organisation: organisation ?? "",
      ubiRelationship,
      weeklyAvailability,
      linkedinUrl: linkedinUrl ?? "",
      portfolioUrl: portfolioUrl ?? "",
      experienceSummary,
      motivation,
      contributionPlan,
      relevantExample,
      referralSource: referralSource ?? "",
      conflictDisclosure: conflictDisclosure ?? "",
    };
    for (const [key, value] of Object.entries(fields)) {
      const limit = MAX_LENGTHS[key as keyof typeof MAX_LENGTHS];
      if (limit && value.length > limit) {
        return Response.json({ error: `${key} is longer than the permitted limit.` }, { status: 400 });
      }
    }

    const existingApplication = await prisma.volunteerApplication.findFirst({
      where: { email, cohort: VOLUNTEER_COHORT },
      select: { id: true },
    });
    if (existingApplication) {
      return Response.json(
        { error: "An application for Cohort 2 already exists with this email address." },
        { status: 409 }
      );
    }

    try {
      await prisma.volunteerApplication.create({
        data: {
          cohort: VOLUNTEER_COHORT,
          fullName,
          email,
          phone,
          country,
          city,
          timeZone,
          currentRole,
          organisation,
          ubiRelationship,
          primaryDepartment,
          secondaryDepartment,
          weeklyAvailability,
          linkedinUrl,
          portfolioUrl,
          experienceSummary,
          motivation,
          contributionPlan,
          relevantExample,
          referralSource,
          conflictDisclosure,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return Response.json(
          { error: "An application for Cohort 2 already exists with this email address." },
          { status: 409 }
        );
      }
      throw error;
    }

    let emailStatus: "sent" | "queued" = "sent";
    try {
      await sendVolunteerApplicationConfirmation(email, fullName, primaryDepartment);
    } catch (error) {
      logger.error("volunteer_confirmation_email_failed", error, { email });
      const rendered = renderVolunteerApplicationConfirmation(fullName, primaryDepartment);
      await prisma.emailQueueItem.create({
        data: {
          kind: "GENERAL",
          toEmail: email,
          subject: rendered.subject,
          body: rendered.html,
          context: {
            source: "volunteer_application",
            cohort: VOLUNTEER_COHORT,
            primaryDepartment,
          },
        },
      });
      emailStatus = "queued";
    }

    return Response.json({ success: true, emailStatus }, { status: 201 });
  } catch (error) {
    logger.error("volunteer_application_failed", error);
    return Response.json({ error: "We could not save your application. Please try again." }, { status: 500 });
  }
}
