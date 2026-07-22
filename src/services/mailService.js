const APP_NAME = process.env.APP_NAME || "FixHub";
const APP_URL = (process.env.CLIENT_URL || "https://fixhub-client.vercel.app").replace(/\/$/, "");
const FROM_EMAIL = process.env.MAIL_FROM || `${APP_NAME} <no-reply@fixhub.app>`;

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function wrapEmail({ title, preview, body }) {
    return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;background:#111827;font-family:Arial,Helvetica,sans-serif;color:#e5e7eb;">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preview)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#111827;padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#1f2937;border-radius:20px;border-top:6px solid #2563eb;overflow:hidden;">
          <tr>
            <td style="padding:30px 32px 10px;">
              <div style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:.04em;">${escapeHtml(APP_NAME)}</div>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 32px 34px;">
              ${body}
            </td>
          </tr>
        </table>
        <p style="margin:18px 0 0;color:#94a3b8;font-size:13px;">Need help? Contact FixHub support.</p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildResetCodeEmail({ name, code, ttlMinutes }) {
    const safeName = escapeHtml(name || "there");
    return {
        subject: "Reset your FixHub password",
        html: wrapEmail({
            title: "Reset your FixHub password",
            preview: `Use this ${ttlMinutes}-minute code to reset your FixHub password.`,
            body: `
              <h1 style="margin:0 0 22px;color:#ffffff;font-size:34px;line-height:1.15;">Reset your password</h1>
              <p style="margin:0 0 20px;color:#cbd5e1;font-size:16px;line-height:1.7;">Hi ${safeName},</p>
              <p style="margin:0 0 24px;color:#cbd5e1;font-size:16px;line-height:1.7;">We received a request to reset the password for your FixHub account. Enter the code below to continue.</p>
              <div style="margin:24px 0;padding:22px;border:1px solid #334155;border-radius:14px;background:#111827;text-align:center;color:#dbeafe;font-size:36px;font-weight:800;letter-spacing:14px;">${escapeHtml(code)}</div>
              <p style="margin:0 0 20px;color:#ffffff;font-size:15px;font-weight:700;">This code expires in ${ttlMinutes} minutes.</p>
              <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            `,
        }),
    };
}

function buildPasswordChangedEmail({ name }) {
    const safeName = escapeHtml(name || "there");
    return {
        subject: "Your FixHub password was changed",
        html: wrapEmail({
            title: "Your FixHub password was changed",
            preview: "Your FixHub password was changed successfully.",
            body: `
              <h1 style="margin:0 0 22px;color:#ffffff;font-size:34px;line-height:1.15;">Your password was changed</h1>
              <p style="margin:0 0 20px;color:#cbd5e1;font-size:16px;line-height:1.7;">Hi ${safeName},</p>
              <p style="margin:0 0 24px;color:#cbd5e1;font-size:16px;line-height:1.7;">The password for your FixHub account was changed successfully.</p>
              <div style="margin:24px 0;padding:20px;border-radius:14px;background:#1e3a8a;color:#dbeafe;font-size:15px;line-height:1.7;"><strong>If you made this change:</strong> no further action is required. Sign in again using your new password.</div>
              <p style="margin:0 0 26px;color:#cbd5e1;font-size:15px;line-height:1.7;">If you did not change your password, secure your account immediately and contact FixHub support.</p>
              <a href="${escapeHtml(APP_URL)}/forgot-password" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;">Secure your account</a>
            `,
        }),
    };
}

async function sendWithResend({ to, subject, html }) {
    if (!process.env.RESEND_API_KEY) {
        return false;
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        }),
    });

    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Resend email failed: ${body}`);
    }

    return true;
}

async function sendWithSmtp({ to, subject, html }) {
    if (!process.env.SMTP_HOST) {
        return false;
    }

    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === "true",
        auth: process.env.SMTP_USER
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            }
            : undefined,
    });

    await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
    });

    return true;
}

async function sendEmail(message) {
    if (await sendWithResend(message)) {
        return { sent: true, provider: "resend" };
    }

    if (await sendWithSmtp(message)) {
        return { sent: true, provider: "smtp" };
    }

    if (process.env.NODE_ENV !== "production") {
        console.info(`[email not configured] ${message.subject} -> ${message.to}`);
        return { sent: false, provider: "console" };
    }

    throw new Error("Email delivery is not configured.");
}

module.exports = {
    buildPasswordChangedEmail,
    buildResetCodeEmail,
    isEmailConfigured: () => Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST),
    sendEmail,
};
