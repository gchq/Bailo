import Mail from 'nodemailer/lib/mailer/index.js'

/**
 * Ensures all email properties can be parsed (e.g by AWS SES or other cloud provider)
 * @param email {Mail.Options} the email details
 * @returns The sanitised email details
 */
export function sanitiseEmail(email: Mail.Options): Mail.Options {
  return {
    from: email.from,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: typeof email.html === 'string' ? email.html : undefined,
    attachments: email.attachments,
  }
}
