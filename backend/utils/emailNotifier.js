const emailLogs = [];

async function sendEmailNotification(recipientEmail, recipientName, subject, eventType, bodyHtml) {
  try {
    const emailRecord = {
      id: `EMAIL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientEmail,
      recipientName,
      subject,
      eventType,
      bodyHtml,
      sentAt: new Date().toISOString(),
      status: 'Delivered'
    };

    emailLogs.unshift(emailRecord);
    if (emailLogs.length > 100) emailLogs.pop();

    console.log(`[EMAIL DISPATCHER] Subject: "${subject}" -> ${recipientName} <${recipientEmail}> [Event: ${eventType}]`);
    return emailRecord;
  } catch (err) {
    console.error('[EMAIL DISPATCHER ERROR]', err.message);
  }
}

function getEmailLogs() {
  return emailLogs;
}

module.exports = { sendEmailNotification, getEmailLogs };
