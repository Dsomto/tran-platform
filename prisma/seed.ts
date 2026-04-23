import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin user — read from env; skip if not provided (production DB already has one).
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPasswordPlain = process.env.ADMIN_PASSWORD;

  let admin: { id: string; email: string } | null = null;

  if (adminEmail && adminPasswordPlain) {
    const adminPassword = await bcrypt.hash(adminPasswordPlain, 12);
    admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { password: adminPassword, role: "SUPER_ADMIN" },
      create: {
        email: adminEmail,
        password: adminPassword,
        firstName: process.env.ADMIN_FIRST_NAME ?? "Admin",
        lastName: process.env.ADMIN_LAST_NAME ?? "User",
        role: "SUPER_ADMIN",
      },
      select: { id: true, email: true },
    });
    console.log("Admin ready:", admin.email);
  } else {
    // Fall back to any existing SUPER_ADMIN so downstream rows that need
    // a reviewedBy user still link to a real user.
    const existing = await prisma.user.findFirst({
      where: { role: "SUPER_ADMIN" },
      select: { id: true, email: true },
    });
    admin = existing;
    if (!admin) {
      console.log(
        "No admin in DB and no ADMIN_EMAIL/ADMIN_PASSWORD env set — sample application rows will have reviewedBy=null."
      );
    }
  }

  // Create sample teams
  const teams = await Promise.all(
    [
      { name: "Firewall Breakers", description: "Elite pentest team" },
      { name: "Shadow Ops", description: "Stealth and recon specialists" },
      { name: "Cipher Lords", description: "Cryptography and secure comms" },
      { name: "Zero Day", description: "Vulnerability researchers" },
      { name: "Packet Storm", description: "Network security experts" },
    ].map((t) =>
      prisma.team.upsert({
        where: { name: t.name },
        update: {},
        create: t,
      })
    )
  );
  console.log(`Created ${teams.length} teams`);

  // Create sample interns
  const internPassword = await bcrypt.hash("intern123456", 12);
  const tracks = [
    "SOC_ANALYSIS",
    "ETHICAL_HACKING",
    "GRC",
  ] as const;

  const internNames = [
    ["Aisha", "Okonkwo"],
    ["David", "Chen"],
    ["Fatima", "Al-Hassan"],
    ["James", "Mwangi"],
    ["Sarah", "Rodriguez"],
    ["Emmanuel", "Obi"],
    ["Priya", "Sharma"],
    ["Carlos", "Mendez"],
    ["Yuki", "Tanaka"],
    ["Oluwaseun", "Adeyemi"],
    ["Maria", "Santos"],
    ["Ahmed", "Hassan"],
    ["Lena", "Schmidt"],
    ["Kwame", "Asante"],
    ["Sophia", "Park"],
  ];

  for (let i = 0; i < internNames.length; i++) {
    const [firstName, lastName] = internNames[i];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
    const track = tracks[i % tracks.length];
    const stage = `STAGE_${Math.min(i % 5, 9)}` as "STAGE_0" | "STAGE_1" | "STAGE_2" | "STAGE_3" | "STAGE_4";
    const teamIndex = i % teams.length;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: internPassword,
        firstName,
        lastName,
        role: "INTERN",
      },
    });

    // Create application (approved)
    await prisma.application.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        status: "APPROVED",
        whyJoin: `I want to build a career in ${track.replace(/_/g, " ").toLowerCase()} and UBI is the best program to do it.`,
        experience: `${i + 1} years of IT experience. Familiar with Linux, networking, and basic security concepts. Completed various CTF challenges.`,
        preferredTrack: track,
        hoursPerWeek: 20 + (i % 3) * 10,
        country: ["Nigeria", "India", "USA", "Kenya", "Brazil", "Germany", "Japan", "Ghana"][i % 8],
        timezone: ["WAT", "IST", "EST", "EAT", "BRT", "CET", "JST", "GMT"][i % 8],
        reviewedBy: admin?.id ?? null,
        reviewedAt: admin ? new Date() : null,
      },
    });

    // Create intern profile
    await prisma.intern.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        track,
        currentStage: stage,
        points: Math.floor(Math.random() * 500) + 50,
        teamId: teams[teamIndex].id,
      },
    });
  }
  console.log(`Created ${internNames.length} sample interns`);

  // Update team points
  for (const team of teams) {
    const totalPoints = await prisma.intern.aggregate({
      where: { teamId: team.id },
      _sum: { points: true },
    });
    await prisma.team.update({
      where: { id: team.id },
      data: { totalPoints: totalPoints._sum.points || 0 },
    });
  }
  console.log("Updated team points");

  // Create sample assignments
  const assignments = [
    {
      title: "Environment Setup & Basic Recon",
      description: "Set up Kali Linux VM, install essential tools (nmap, Burp Suite, Wireshark), and perform basic reconnaissance on the provided target domain. Submit a report of your findings.",
      stage: "STAGE_0" as const,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      maxPoints: 50,
    },
    {
      title: "Network Scanning & Enumeration",
      description: "Perform a comprehensive network scan on the lab environment. Identify open ports, running services, and potential vulnerabilities. Document everything in a professional pentest report format.",
      stage: "STAGE_1" as const,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      maxPoints: 100,
    },
    {
      title: "Web Application Vulnerability Assessment",
      description: "Find and exploit OWASP Top 10 vulnerabilities in the provided vulnerable web application (DVWA). Document each vulnerability with proof of concept, impact analysis, and remediation recommendations.",
      stage: "STAGE_2" as const,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      maxPoints: 150,
    },
  ];

  for (const a of assignments) {
    await prisma.assignment.create({ data: a });
  }
  console.log(`Created ${assignments.length} sample assignments`);

  // Create announcements — requires an admin (authorId is required on Announcement).
  if (admin) {
    await prisma.announcement.create({
      data: {
        title: "Welcome to UBI Cohort 1!",
        content: "Welcome to the first ever UBI cohort! We're excited to have you all here. Make sure to set up your environment, join the Slack workspace, and check your first assignment. The journey starts now — let's build some cybersecurity excellence!",
        authorId: admin.id,
        isPinned: true,
      },
    });

    await prisma.announcement.create({
      data: {
        title: "Stage 0 Deadline Reminder",
        content: "Reminder: the Stage 0 assignment (Environment Setup & Basic Recon) is due in 5 days. Make sure to submit before the deadline. Late submissions will be penalized. If you need help, reach out in #stage-0 on Slack.",
        authorId: admin.id,
        stage: "STAGE_0",
      },
    });

    console.log("Created sample announcements");
  } else {
    console.log("Skipping announcement seeds — no admin available to attribute them to.");
  }

  // Create pending applications for admin review
  for (let i = 0; i < 5; i++) {
    const firstName = ["Alex", "Jordan", "Morgan", "Casey", "Riley"][i];
    const lastName = ["Thompson", "Williams", "Brown", "Davis", "Wilson"][i];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        password: internPassword,
        firstName,
        lastName,
        role: "INTERN",
      },
    });

    await prisma.application.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        status: "PENDING",
        whyJoin: `I'm passionate about cybersecurity and want to transition from ${["IT support", "web development", "networking", "system administration", "data analysis"][i]}. UBI's hands-on approach is exactly what I need to break into the security field.`,
        experience: `${i + 1} years in tech. Completed CompTIA Security+ certification. Participated in ${i + 2} CTF competitions. Built a ${["home lab", "network monitoring tool", "port scanner", "vulnerability scanner", "phishing awareness tool"][i]}.`,
        preferredTrack: tracks[i % tracks.length],
        hoursPerWeek: 20,
        country: ["USA", "UK", "Canada", "Australia", "South Africa"][i],
        timezone: ["EST", "GMT", "EST", "AEST", "SAST"][i],
        githubUrl: `https://github.com/${firstName.toLowerCase()}${lastName.toLowerCase()}`,
        linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}`,
      },
    });
  }
  console.log("Created 5 pending applications for admin review");

  console.log("\nSeed complete!");
  if (adminEmail) {
    console.log(`\nAdmin login: ${adminEmail} / (the password you provided)`);
  }
  console.log("Intern login: aisha.okonkwo@example.com / intern123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
