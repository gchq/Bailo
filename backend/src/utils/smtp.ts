import nodemailer from 'nodemailer'

import config from './config.js'
import logger from './logger.js'
import { GenericError } from './result.js'

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string
  subject: string
  text: string
  html?: string
}) {
  if (!config.smtp.enabled) {
    logger.info({ subject, to }, 'Not sending email due to SMTP disabled')
    return
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.connection.host,
    port: config.smtp.connection.port,
    secure: config.smtp.connection.secure,
    auth: config.smtp.connection.auth,
    tls: config.smtp.connection.tls,
  })

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from, // sender address
      to,
      subject,
      text,
      html,
    })
    logger.info({ messageId: info.messageId }, 'Email sent')
  } catch (err) {
    logger.error(err)
    throw GenericError(
      {
        to,
        text,
      },
      'Error sending email notification',
      500,
    )
  }
}
