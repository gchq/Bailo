import nodemailer, { Transporter } from 'nodemailer'

import config from '../../utils/v2/config.js'
import { GenericError } from '../../utils/v2/error.js'
import log from './log.js'

let transporter: undefined | Transporter = undefined

export async function sendEmail(to: string, subject: string, body: string, html?: string) {
  console.log(config)
  if (!config.smtp.enabled) {
    log.info({ subject, to }, 'Not sending email due to SMTP disabled')
    return
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.connection.host,
      port: config.smtp.connection.port,
      secure: config.smtp.connection.secure,
      auth: config.smtp.connection.auth,
      tls: config.smtp.connection.tls,
    })
  }

  try {
    const info = await transporter.sendMail({
      from: config.smtp.from, // sender address
      to,
      subject,
      text: body,
      html,
    })
    log.info({ messageId: info.messageId }, 'Email sent')
  } catch (err) {
    throw GenericError(500, 'Error Sending email notification', { to, body, internal: err })
  }
}
