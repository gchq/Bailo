import nodemailer from 'nodemailer'
import config from 'config'
import logger from './logger'

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

  if (!config.get('smtp.enabled')) {
    logger.info({ subject, to }, 'Not sending email due to SMTP disabled')
    return
  }

  const transporter = nodemailer.createTransport({
    host: config.get('smtp.host'),
    port: config.get('smtp.port'),
    secure: config.get('smtp.secure'),
    auth: {
      user: config.get('smtp.auth.user'),
      pass: config.get('smtp.auth.pass'),
    },
    tls: config.get('smtp.tls'),
  })

  try {
    const info = await transporter.sendMail({
      from: config.get('smtp.from'), // sender address
      to,
      subject,
      text,
      html,
    })
  } catch(err) {
    console.log('error sending email')
    console.log(err)
  }

  console.log('email sent')

  //logger.info({ messageId: info.messageId }, 'Email sent')
}
