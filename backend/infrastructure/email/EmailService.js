const emailLogs = [];

class EmailService {
  static async sendEmail(recipientEmail, recipientName, subject, eventType, bodyHtml) {
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

      console.log(`[Email Infrastructure] Delivered: "${subject}" to ${recipientName} <${recipientEmail}> [${eventType}]`);
      return emailRecord;
    } catch (err) {
      console.error('[Email Infrastructure Error]', err.message);
    }
  }

  static getEmailLogs() {
    return emailLogs;
  }
}

module.exports = EmailService;
