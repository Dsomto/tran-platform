const DEFAULT_ORIGIN = "https://ubuntubridgeinitiatives.org";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function firstNameFrom(fullName: string): string {
  return escapeHtml(fullName.trim().split(/\s+/)[0] || "there");
}

function emailShell(content: string, preheader: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="x-ua-compatible" content="ie=edge"></head>
<body style="margin:0;padding:0;background:#E8EEF2;color:#173247;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#E8EEF2;">
    <tr><td align="center" style="padding:26px 12px;">
      <table role="presentation" width="640" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:640px;background:#FFFFFF;border:1px solid #CFDCE3;border-radius:8px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;box-shadow:0 14px 38px rgba(19,50,71,.10);">
        ${content}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function brandHeader(origin: string, label: string): string {
  return `<tr><td style="height:6px;background:#16A394;font-size:0;line-height:0;">&nbsp;</td></tr>
  <tr><td style="padding:19px 28px;background:#102D43;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      <td width="72" valign="middle"><div style="width:62px;height:46px;background:#FFFFFF;border-radius:5px;text-align:center;overflow:hidden;"><img src="${origin}/brand/ubi-logo.png" width="62" alt="Ubuntu Bridge Initiative" style="display:block;width:62px;height:auto;margin:-1px auto 0;border:0;"></div></td>
      <td valign="middle"><div style="color:#FFFFFF;font-size:14px;font-weight:800;">Ubuntu Bridge Initiative</div><div style="margin-top:3px;color:#ABC1CE;font-size:11px;">Cohort 2 volunteer programme</div></td>
      <td align="right" valign="middle"><div style="display:inline-block;padding:6px 9px;border:1px solid #46677B;border-radius:4px;color:#D7E4EA;font-size:9px;font-weight:800;text-transform:uppercase;">${escapeHtml(label)}</div></td>
    </tr></table>
  </td></tr>`;
}

export function renderVolunteerInvitationEmail(
  fullName: string,
  origin = DEFAULT_ORIGIN
): { subject: string; html: string } {
  const firstName = firstNameFrom(fullName);
  const subject = "You know what UBI feels like. Help us build Cohort 2.";
  const content = `${brandHeader(origin, "An invitation")}
    <tr><td><img src="${origin}/images/hero-3.jpg" width="640" alt="Members of the Ubuntu Bridge Initiative community" style="display:block;width:100%;height:auto;border:0;"></td></tr>
    <tr><td style="padding:34px 30px 28px;background:#F6FAFB;border-bottom:1px solid #DBE6EA;">
      <div style="margin:0 0 10px;color:#087A70;font-size:11px;font-weight:800;text-transform:uppercase;">Cohort 2 volunteer applications are open</div>
      <h1 style="margin:0;max-width:550px;color:#102A43;font-family:Georgia,'Times New Roman',serif;font-size:34px;line-height:1.18;font-weight:700;">You lived the programme.<br>Now help us build the next one.</h1>
      <div style="width:55px;height:4px;margin:19px 0 0;background:#E5B842;"></div>
    </td></tr>
    <tr><td style="padding:31px 30px 38px;color:#365463;font-size:15px;line-height:1.72;">
      <p style="margin:0 0 18px;">Hi ${firstName},</p>
      <p style="margin:0 0 18px;">You made it to Stage 2 and beyond in UBI Cohort One. That means you do not know this programme from the outside. You know the pressure, the confusion, the breakthroughs, the moments support mattered, and the small things that made someone keep going.</p>
      <p style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;color:#102A43;font-size:21px;line-height:1.48;font-weight:700;">That lived experience is exactly why I am writing to you.</p>

      <div style="margin:0 0 24px;padding:23px 22px;background:#102D43;border-radius:7px;color:#DCE8ED;">
        <div style="margin:0 0 8px;color:#E8BD4B;font-size:11px;font-weight:800;text-transform:uppercase;">Ten teams. One programme.</div>
        <div style="color:#FFFFFF;font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.43;font-weight:700;">We are assembling the volunteer team that will make Cohort 2 clearer, stronger, fairer, and more ambitious.</div>
        <div style="margin-top:13px;color:#BFD0D8;font-size:13px;line-height:1.7;">Partnerships &middot; Mentorship &middot; Community &middot; Grading &middot; Curriculum &middot; Programme Operations &middot; Design &middot; Communications &middot; Technology &middot; Research &amp; Impact</div>
      </div>

      <p style="margin:0 0 18px;">Some roles require deep cybersecurity experience. Others need thoughtful communicators, organisers, designers, researchers, builders, and people who know how to care for a community while still holding a high standard.</p>
      <p style="margin:0 0 22px;">This is real volunteer work. It is unpaid, it requires dependable time, and we will expect ownership. Please choose the team where you can contribute consistently, not simply the team whose title sounds most impressive.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;"><tr><td align="center">
        <a href="${origin}/volunteer" style="display:inline-block;background:#126F67;color:#FFFFFF;text-decoration:none;padding:15px 23px;border-radius:5px;font-size:14px;font-weight:800;">Choose a volunteer team</a>
      </td></tr></table>

      <div style="margin:0 0 25px;padding:17px 18px;background:#FFF8E5;border:1px solid #EDD991;border-left:5px solid #E5B842;border-radius:5px;color:#5B491B;font-size:13px;line-height:1.7;"><strong style="color:#5A4306;">Take your time with the form.</strong> Tell us what you have done, where you can help, and how much time you can honestly give. A careful application is more useful than a fast one.</div>

      <p style="margin:0;">Thank you for how far you carried Cohort One. I would be glad to build the next chapter with you.<br><br><strong style="color:#102A43;">Somto from UBI</strong><br><span style="color:#718792;font-size:13px;">Ubuntu Bridge Initiative</span></p>
    </td></tr>
    <tr><td style="padding:17px 30px;background:#F5F8FA;border-top:1px solid #DCE6EA;color:#728791;font-size:11px;line-height:1.55;">You are receiving this invitation because you progressed to Stage 2 or beyond in Ubuntu Bridge Initiative Cohort One.</td></tr>`;

  return {
    subject,
    html: emailShell(content, "Cohort 2 volunteer applications are open. Help us build the next UBI programme."),
  };
}

export function renderVolunteerApplicationConfirmationEmail(
  fullName: string,
  departmentName: string,
  origin = DEFAULT_ORIGIN
): { subject: string; html: string } {
  const firstName = firstNameFrom(fullName);
  const safeDepartment = escapeHtml(departmentName || "your selected team");
  const subject = `We received your volunteer application, ${firstName}`;
  const content = `${brandHeader(origin, "Application received")}
    <tr><td><img src="${origin}/images/programs/workshops.jpg" width="640" alt="A UBI cybersecurity learning session" style="display:block;width:100%;height:auto;border:0;"></td></tr>
    <tr><td style="padding:33px 30px 27px;background:#F6FAFB;border-bottom:1px solid #DBE6EA;">
      <div style="margin:0 0 10px;color:#087A70;font-size:11px;font-weight:800;text-transform:uppercase;">Your application is safely in</div>
      <h1 style="margin:0;color:#102A43;font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.2;font-weight:700;">Thank you for raising your hand, ${firstName}.</h1>
      <div style="width:55px;height:4px;margin:19px 0 0;background:#E5B842;"></div>
    </td></tr>
    <tr><td style="padding:31px 30px 37px;color:#365463;font-size:15px;line-height:1.72;">
      <p style="margin:0 0 18px;">We have received your application to help build UBI Cohort 2. Volunteering is an offer of your time, judgement, and experience, and we do not take that offer lightly.</p>

      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 25px;border:1px solid #CFE0E2;border-collapse:separate;border-radius:7px;overflow:hidden;">
        <tr><td style="padding:12px 17px;background:#E9F5F3;color:#14665F;font-size:10px;font-weight:800;text-transform:uppercase;">Your first-choice team</td></tr>
        <tr><td style="padding:17px;background:#FFFFFF;color:#102A43;font-family:Georgia,'Times New Roman',serif;font-size:21px;line-height:1.35;font-weight:700;">${safeDepartment}</td></tr>
      </table>

      <h2 style="margin:0 0 14px;color:#102A43;font-size:14px;font-weight:800;text-transform:uppercase;">What happens next</h2>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr><td width="36" valign="top" style="padding:0 11px 16px 0;"><div style="width:28px;height:28px;background:#126F67;color:#FFFFFF;border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:800;">1</div></td><td valign="top" style="padding:2px 0 16px;"><strong style="display:block;color:#102A43;font-size:14px;">We read the complete application</strong><span style="color:#667D88;font-size:13px;line-height:1.6;">We will consider your evidence, team fit, availability, and the programme's needs.</span></td></tr>
        <tr><td width="36" valign="top" style="padding:0 11px 16px 0;"><div style="width:28px;height:28px;background:#DDEBEA;color:#126F67;border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:800;">2</div></td><td valign="top" style="padding:2px 0 16px;"><strong style="display:block;color:#102A43;font-size:14px;">Shortlisted volunteers hear from us</strong><span style="color:#667D88;font-size:13px;line-height:1.6;">We may invite you to a short conversation or ask a focused follow-up question.</span></td></tr>
        <tr><td width="36" valign="top" style="padding:0 11px 0 0;"><div style="width:28px;height:28px;background:#DDEBEA;color:#126F67;border-radius:50%;text-align:center;line-height:28px;font-size:12px;font-weight:800;">3</div></td><td valign="top" style="padding:2px 0;"><strong style="display:block;color:#102A43;font-size:14px;">Selected teams are onboarded</strong><span style="color:#667D88;font-size:13px;line-height:1.6;">Every selected volunteer will receive a defined role, responsibilities, and working rhythm.</span></td></tr>
      </table>

      <div style="margin:0 0 25px;padding:17px 18px;background:#FFF8E5;border:1px solid #EDD991;border-left:5px solid #E5B842;border-radius:5px;color:#5B491B;font-size:13px;line-height:1.7;"><strong style="color:#5A4306;">You do not need to apply again.</strong> We have what you submitted. The next message from us will be an update, a question, or a decision.</div>

      <p style="margin:0;">Thank you for wanting to return and build with us.<br><br><strong style="color:#102A43;">Somto from UBI</strong><br><span style="color:#718792;font-size:13px;">Ubuntu Bridge Initiative</span></p>
    </td></tr>
    <tr><td style="padding:17px 30px;background:#F5F8FA;border-top:1px solid #DCE6EA;color:#728791;font-size:11px;line-height:1.55;">This is the automatic confirmation for your UBI Cohort 2 volunteer application.</td></tr>`;

  return {
    subject,
    html: emailShell(content, `We received your application for ${departmentName}.`),
  };
}
