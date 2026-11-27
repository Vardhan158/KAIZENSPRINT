const nodemailer = require('nodemailer');

async function sendEmployeeInvitation({ email, name, token, employeeId }) {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.BREVO_USER || process.env.SMTP_USER;
  const pass = process.env.BREVO_PASS || process.env.SMTP_PASS;
  const senderName = process.env.EMAIL_FROM_NAME || 'KaizenSprint Admin';
  const senderEmail = process.env.BREVO_FROM_EMAIL || 'harshavardhandevang@gmail.com';
  const fromHeader = process.env.SMTP_FROM || `"${senderName}" <${senderEmail}>`;

  const frontendUrl = String(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const activationUrl = `${frontendUrl}/activate-account?token=${encodeURIComponent(token)}`;
  const subject = 'Activate your KaizenSprint employee account';
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
      <h2 style="color: #2563EB; margin-top: 0;">Welcome to KaizenSprint!</h2>
      <p style="font-size: 14px; color: #1e293b;">Hello <strong>${name}</strong>,</p>
      <p style="font-size: 14px; color: #475569;">Your employee account has been created with Employee ID: <strong style="color: #2563EB;">${employeeId}</strong>.</p>
      <p style="font-size: 14px; color: #475569;">Please click the button below to activate your account and set your password:</p>
      <p style="margin: 24px 0;">
        <a href="${activationUrl}" style="background-color: #2563EB; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">Activate Employee Account</a>
      </p>
      <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">This activation link expires in 24 hours.</p>
    </div>
  `;

  if (!user || !pass) {
    console.warn('[Brevo SMTP Warning] BREVO_USER or BREVO_PASS not set.');
    return { delivered: false, messageId: null, activationUrl, error: 'SMTP credentials not configured in .env' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from: fromHeader,
      to: email,
      subject,
      html: htmlBody
    });

    console.log(`[Brevo SMTP Success] Invitation email delivered to ${email} (Message ID: ${info.messageId})`);
    return { delivered: true, messageId: info.messageId, activationUrl };
  } catch (smtpErr) {
    console.warn(`[Brevo SMTP Delivery Failed] Email: ${email}, Reason: ${smtpErr.message}`);
    return { delivered: false, messageId: null, activationUrl, error: smtpErr.message };
  }
}

module.exports = { sendEmployeeInvitation };
