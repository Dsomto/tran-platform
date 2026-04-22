// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require("pdfkit");

export function generateAcceptancePDF(
  fullName: string,
  trackInterest: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - 144; // 72 margin each side
    const date = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    // ─── LETTERHEAD ────────────────────────────────────
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .fillColor("#2563EB")
      .text("UBI", 72, 72, { continued: false });

    doc
      .fontSize(8)
      .font("Helvetica")
      .fillColor("#6B7280")
      .text("UBUNTU BRIDGE INITIATIVE", 72, 95);

    doc
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#6B7280")
      .text("Lagos, Nigeria", 72, 72, { align: "right" })
      .text("info@ubinitiative.org", { align: "right" });

    // Line under letterhead
    doc
      .moveTo(72, 115)
      .lineTo(72 + pageWidth, 115)
      .strokeColor("#1F2937")
      .lineWidth(1.5)
      .stroke();

    // ─── DATE ──────────────────────────────────────────
    let y = 135;
    doc.fontSize(10).font("Helvetica").fillColor("#374151").text(date, 72, y);

    // ─── RECIPIENT ────────────────────────────────────
    y += 30;
    doc.font("Helvetica-Bold").text(fullName, 72, y);
    doc.font("Helvetica").text("UBI Cybersecurity Internship Programme");
    doc.text(`Cohort 1 — ${trackInterest}`);

    // ─── SALUTATION ───────────────────────────────────
    y = doc.y + 20;
    const firstName = fullName.split(" ")[0];
    doc.font("Helvetica").text(`Dear ${firstName},`, 72, y);

    // ─── SUBJECT ──────────────────────────────────────
    y = doc.y + 16;
    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor("#111827")
      .text(
        "LETTER OF ACCEPTANCE — UBI CYBERSECURITY INTERNSHIP PROGRAMME (COHORT 1)",
        72,
        y,
        { underline: true }
      );

    // ─── BODY ─────────────────────────────────────────
    y = doc.y + 16;
    doc.font("Helvetica").fontSize(10).fillColor("#374151");

    const body = [
      `On behalf of Ubuntu Bridge Initiative (UBI), I am pleased to inform you that your application to the UBI Cybersecurity Internship Programme has been accepted. Congratulations!`,
      `After carefully reviewing all applications, you have been selected to join Cohort 1 of our programme. We received an overwhelming number of applications and your profile stood out among them.`,
    ];
    for (const para of body) {
      doc.text(para, 72, y, { width: pageWidth, lineGap: 4 });
      y = doc.y + 12;
    }

    // Programme Details heading
    doc.font("Helvetica-Bold").fillColor("#111827").text("Programme Details", 72, y);
    y = doc.y + 8;
    doc.font("Helvetica").fillColor("#374151");

    const details = [
      `• Orientation: Friday, 30th May 2025 — A mandatory virtual session where you will meet the team, understand the programme structure, and get set up for Stage 0.`,
      `• Programme Start Date: Sunday, 1st June 2025 — The official start of the 10-stage programme.`,
      `• Track: ${trackInterest}`,
      `• Format: Fully remote, self-paced within weekly deadlines. Performance-based progression through 10 stages.`,
    ];
    for (const item of details) {
      doc.text(item, 82, y, { width: pageWidth - 10, lineGap: 3 });
      y = doc.y + 6;
    }

    // What You Stand to Gain
    y += 6;
    doc.font("Helvetica-Bold").fillColor("#111827").text("What You Stand to Gain", 72, y);
    y = doc.y + 8;
    doc.font("Helvetica").fillColor("#374151");

    doc.text(
      "UBI is designed to take you from foundational cybersecurity knowledge to job-ready expertise. Here is what awaits you at each milestone:",
      72,
      y,
      { width: pageWidth, lineGap: 3 }
    );
    y = doc.y + 8;

    const gains = [
      `• Stage 5 — Alumni Community Access: If you successfully progress to Stage 5, you earn a place in the UBI Alumni Network. Our alumni community offers structured programmes designed to make you job-ready, access to exclusive workshops, and direct connections with industry professionals.`,
      `• Finalists — Top Tier Benefits: Participants who make it to the final stage will receive: 1-on-1 mentorship from senior cybersecurity professionals, hardware devices (laptops) to support your career, and priority placement on our Hire page — finalists are prioritised first for job opportunities.`,
    ];
    for (const item of gains) {
      doc.text(item, 82, y, { width: pageWidth - 10, lineGap: 3 });
      y = doc.y + 6;
    }

    // Important Notes
    y += 6;
    if (y > 680) {
      doc.addPage();
      y = 72;
    }
    doc.font("Helvetica-Bold").fillColor("#111827").text("Important Notes", 72, y);
    y = doc.y + 8;
    doc.font("Helvetica").fillColor("#374151");

    const notes = [
      `1. Attendance at the orientation on 30th May is mandatory. Failure to attend may result in forfeiture of your spot.`,
      `2. The programme is elimination-based. You must meet the performance requirements at each stage to advance. There are no exceptions.`,
      `3. Further details, including the Slack workspace invite and onboarding guide, will be sent to you before orientation.`,
    ];
    for (const item of notes) {
      doc.text(item, 82, y, { width: pageWidth - 10, lineGap: 3 });
      y = doc.y + 6;
    }

    // Closing
    y += 8;
    doc.text(
      "We are excited to have you join UBI. This is the beginning of a journey that can reshape your career. Bring your best, stay committed, and make the most of this opportunity.",
      72,
      y,
      { width: pageWidth, lineGap: 3 }
    );
    y = doc.y + 8;
    doc.text("Welcome aboard.", 72, y);

    // ─── SIGN-OFF ─────────────────────────────────────
    y = doc.y + 30;
    if (y > 700) {
      doc.addPage();
      y = 72;
    }
    doc.text("Yours faithfully,", 72, y);

    y += 30;
    doc.font("Helvetica-BoldOblique").fontSize(18).fillColor("#111827").text("Okoma Somto", 72, y);

    y = doc.y + 8;
    doc
      .moveTo(72, y)
      .lineTo(230, y)
      .strokeColor("#9CA3AF")
      .lineWidth(0.5)
      .stroke();

    y += 6;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#374151");
    doc.text("Okoma Somtochukwu", 72, y);
    doc.font("Helvetica").text("Head of Program");
    doc.text("Ubuntu Bridge Initiative (UBI)");

    doc.end();
  });
}
