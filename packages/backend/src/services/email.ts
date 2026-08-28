import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

let resend: Resend | null = null;

if (resendApiKey) {
  resend = new Resend(resendApiKey);
} else {
  console.warn("⚠️  RESEND_API_KEY not set — email notifications are disabled");
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Send a transactional email. Silently fails if RESEND_API_KEY is not configured.
 * Returns true if sent, false if skipped.
 */
export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  if (!resend) {
    console.log(`📧 [Email disabled] Would send to ${params.to}: ${params.subject}`);
    return false;
  }

  try {
    const from = params.from || "Montessori ERP <notifications@montessori-erp.com>";
    await resend.emails.send({
      from,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    });
    console.log(`📧 Email sent to ${params.to}: ${params.subject}`);
    return true;
  } catch (error) {
    console.error(`📧 Failed to send email to ${params.to}:`, error);
    return false;
  }
}

/**
 * Send a new message notification email
 */
export async function sendNewMessageEmail(data: {
  recipientEmail: string;
  recipientName: string;
  senderName: string;
  subject?: string | null;
  content: string;
  schoolName: string;
  isReply?: boolean;
}) {
  const subjectLine = data.subject || "New Message";
  const preview = data.content.length > 200 ? data.content.slice(0, 200) + "..." : data.content;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:48px;height:48px;background:#FF6B35;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:20px;">✉</span>
      </div>
      <h1 style="margin:16px 0 4px;font-size:24px;color:#1F1B16;font-weight:700;">${data.schoolName}</h1>
      <p style="margin:0;font-size:13px;color:#6B6560;">Montessori ERP</p>
    </div>

    <!-- Card -->
    <div style="background:#FFFFFF;border-radius:12px;padding:32px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
      <div style="margin-bottom:20px;">
        <span style="display:inline-block;background:#FFE8DC;color:#FF6B35;font-size:12px;font-weight:600;padding:4px 12px;border-radius:20px;">
          ${data.isReply ? "↩ Reply" : "✉ New Message"}
        </span>
      </div>

      <p style="font-size:14px;color:#6B6560;margin:0 0 16px;">Hi ${data.recipientName},</p>

      <p style="font-size:14px;color:#1F1B16;margin:0 0 16px;">
        <strong>${data.senderName}</strong> ${data.isReply ? "replied to your message" : "sent you a message"}.
      </p>

      ${data.subject ? `<h2 style="font-size:16px;color:#1F1B16;margin:0 0 12px;font-weight:600;">${data.subject}</h2>` : ""}

      <div style="background:#F3F2EF;border-radius:8px;padding:16px;margin-bottom:24px;">
        <p style="font-size:14px;color:#1F1B16;margin:0;white-space:pre-wrap;line-height:1.6;">${preview}</p>
      </div>

      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/messages" style="display:inline-block;background:#FF6B35;color:white;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
        View Message
      </a>
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="font-size:12px;color:#6B6560;margin:0;">
        You received this email because you have an account at ${data.schoolName}.
      </p>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: data.recipientEmail,
    subject: `${data.isReply ? "↩" : "✉"} ${subjectLine} — ${data.senderName}`,
    html,
  });
}

/**
 * Send a staff account creation / welcome email
 */
export async function sendStaffWelcomeEmail(data: {
  email: string;
  name: string;
  tempPassword: string;
  role: string;
  schoolName: string;
}) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#FAFAF9;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:48px;height:48px;background:#FF6B35;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;">
        <span style="color:white;font-size:20px;">🎓</span>
      </div>
      <h1 style="margin:16px 0 4px;font-size:24px;color:#1F1B16;font-weight:700;">Welcome to ${data.schoolName}</h1>
    </div>

    <div style="background:#FFFFFF;border-radius:12px;padding:32px;box-shadow:0 1px 2px rgba(0,0,0,0.04);">
      <p style="font-size:14px;color:#1F1B16;margin:0 0 16px;">Hi ${data.name},</p>
      <p style="font-size:14px;color:#1F1B16;margin:0 0 20px;">
        Your account has been created at <strong>${data.schoolName}</strong>. Here are your login credentials:
      </p>

      <div style="background:#F3F2EF;border-radius:8px;padding:20px;margin-bottom:24px;">
        <div style="margin-bottom:12px;">
          <span style="font-size:11px;font-weight:600;color:#6B6560;text-transform:uppercase;letter-spacing:0.5px;">Email</span>
          <p style="font-size:14px;color:#1F1B16;margin:4px 0 0;font-family:monospace;">${data.email}</p>
        </div>
        <div style="margin-bottom:12px;">
          <span style="font-size:11px;font-weight:600;color:#6B6560;text-transform:uppercase;letter-spacing:0.5px;">Temporary Password</span>
          <p style="font-size:14px;color:#FF6B35;margin:4px 0 0;font-family:monospace;font-weight:bold;">${data.tempPassword}</p>
        </div>
        <div>
          <span style="font-size:11px;font-weight:600;color:#6B6560;text-transform:uppercase;letter-spacing:0.5px;">Role</span>
          <p style="font-size:14px;color:#1F1B16;margin:4px 0 0;text-transform:capitalize;">${data.role.replace("_", " ")}</p>
        </div>
      </div>

      <div style="background:#FFF3CD;border-radius:8px;padding:12px;margin-bottom:24px;">
        <p style="font-size:13px;color:#856404;margin:0;">
          ⚠️ Please change your password after your first login for security.
        </p>
      </div>

      <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/login" style="display:inline-block;background:#FF6B35;color:white;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Log In Now
      </a>
    </div>
  </div>
</body>
</html>`;

  return sendEmail({
    to: data.email,
    subject: `Welcome to ${data.schoolName} — Your Login Credentials`,
    html,
  });
}
