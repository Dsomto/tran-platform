export const VOLUNTEER_COHORT = "COHORT_2";

export const volunteerDepartments = [
  {
    id: "sponsorship-partnerships",
    name: "Sponsorship & Partnerships",
    shortName: "Partnerships",
    summary:
      "Find and steward organisations that can fund, equip, or extend the programme.",
    responsibilities: [
      "Research aligned sponsors, grant opportunities, and institutional partners",
      "Prepare outreach briefs, proposals, budgets, and follow-up records",
      "Coordinate partner conversations and hand qualified opportunities to programme leadership",
    ],
    idealFor: "Business development, fundraising, partnerships, grant writing, or relationship management",
    commitment: "5-8 hours weekly",
    accent: "blue",
  },
  {
    id: "mentorship-career-support",
    name: "Mentorship & Career Support",
    shortName: "Mentorship",
    summary:
      "Help participants turn technical growth into confidence, direction, and career readiness.",
    responsibilities: [
      "Host office hours, track check-ins, and focused career conversations",
      "Review CVs, portfolios, LinkedIn profiles, and interview preparation",
      "Escalate wellbeing or learning concerns to the programme team",
    ],
    idealFor: "Cybersecurity practitioners, recruiters, career coaches, educators, and people managers",
    commitment: "3-6 hours weekly",
    accent: "emerald",
  },
  {
    id: "community-operations",
    name: "Community Operations",
    shortName: "Community",
    summary:
      "Keep the cohort informed, supported, respectful, and connected throughout the programme.",
    responsibilities: [
      "Moderate cohort channels and answer routine programme questions",
      "Publish reminders, route unresolved issues, and maintain community records",
      "Create inclusive activities that improve participation without distracting from the work",
    ],
    idealFor: "Community managers, moderators, customer success professionals, and organised communicators",
    commitment: "5-8 hours weekly",
    accent: "cyan",
  },
  {
    id: "assessment-grading",
    name: "Assessment & Grading",
    shortName: "Grading",
    summary:
      "Evaluate submitted work consistently, explain every score, and protect the integrity of progression decisions.",
    responsibilities: [
      "Read complete submissions and grade against approved track rubrics",
      "Write evidence-based feedback that candidates can learn from",
      "Join calibration, quality assurance, and score-dispute reviews",
    ],
    idealFor: "Experienced SOC, ethical hacking, GRC, cloud security, or security engineering practitioners",
    commitment: "6-10 hours during grading windows",
    accent: "amber",
  },
  {
    id: "curriculum-learning-design",
    name: "Curriculum & Learning Design",
    shortName: "Curriculum",
    summary:
      "Design technically rigorous projects that are clear, fair, reproducible, and relevant to industry work.",
    responsibilities: [
      "Develop briefs, labs, datasets, rubrics, answer keys, and setup guidance",
      "Pressure-test technical difficulty, ambiguity, accessibility, and time estimates",
      "Maintain progressive learning outcomes across SOC, Ethical Hacking, and GRC",
    ],
    idealFor: "Security practitioners, technical educators, instructional designers, and lab builders",
    commitment: "6-10 hours weekly before and during active stages",
    accent: "violet",
  },
  {
    id: "programme-operations",
    name: "Programme Operations & Participant Support",
    shortName: "Programme Ops",
    summary:
      "Turn the programme plan into dependable schedules, records, orientations, and participant support.",
    responsibilities: [
      "Coordinate onboarding, calendars, meetings, attendance, and volunteer hand-offs",
      "Maintain operating checklists and follow issues through to resolution",
      "Support accessibility, safeguarding, and fair participant accommodations",
    ],
    idealFor: "Project coordinators, operations professionals, administrators, and detail-oriented organisers",
    commitment: "5-8 hours weekly",
    accent: "rose",
  },
  {
    id: "design-creative",
    name: "Design & Creative",
    shortName: "Design",
    summary:
      "Give the programme a coherent visual language across the platform, learning materials, events, and campaigns.",
    responsibilities: [
      "Create accessible web, social, email, certificate, and event visuals",
      "Maintain reusable brand components and production-ready source files",
      "Work with communications and product teams from brief to final review",
    ],
    idealFor: "Product, UI/UX, visual, motion, brand, and publication designers",
    commitment: "4-8 hours weekly",
    accent: "blue",
  },
  {
    id: "communications-social-media",
    name: "Communications & Social Media",
    shortName: "Communications",
    summary:
      "Tell the programme's story accurately and keep public communication timely, useful, and human.",
    responsibilities: [
      "Plan editorial calendars and produce platform-specific content",
      "Document participant stories, programme milestones, and partner impact",
      "Monitor messages, maintain tone, and measure what communication is working",
    ],
    idealFor: "Writers, editors, content strategists, social media managers, photographers, and video producers",
    commitment: "4-7 hours weekly",
    accent: "emerald",
  },
  {
    id: "technology-platform",
    name: "Technology & Platform",
    shortName: "Technology",
    summary:
      "Build and operate the systems participants, graders, and programme staff rely on.",
    responsibilities: [
      "Improve the web platform, forms, dashboards, automation, and operational tooling",
      "Investigate defects, protect data, and support reliable releases",
      "Translate programme needs into maintainable technical solutions",
    ],
    idealFor: "Software engineers, product engineers, QA testers, DevOps practitioners, and security engineers",
    commitment: "5-10 hours weekly",
    accent: "cyan",
  },
  {
    id: "research-quality-impact",
    name: "Research, Quality & Impact",
    shortName: "Impact",
    summary:
      "Measure whether the programme is fair, effective, and creating meaningful outcomes.",
    responsibilities: [
      "Analyse participation, progression, feedback, and post-programme outcomes",
      "Audit forms, processes, and learning materials for quality and consistency",
      "Turn evidence into recommendations, reports, and partner-ready impact stories",
    ],
    idealFor: "Researchers, data analysts, monitoring and evaluation specialists, auditors, and technical writers",
    commitment: "3-6 hours weekly",
    accent: "amber",
  },
] as const;

export type VolunteerDepartmentId = (typeof volunteerDepartments)[number]["id"];

export const volunteerDepartmentIds = new Set<string>(
  volunteerDepartments.map((department) => department.id)
);

export function getVolunteerDepartment(id: string | null | undefined) {
  return volunteerDepartments.find((department) => department.id === id) ?? null;
}
