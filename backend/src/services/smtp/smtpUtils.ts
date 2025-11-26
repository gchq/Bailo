import nodemailer, { Transporter } from 'nodemailer'

import { createSesTransporter } from '../../clients/ses.js'
import config, { TransportOption } from '../../utils/config.js'
import log from '../log.js'

/**
 * Generates a Node Mailer Transporter.
 * This dictates how the email is sent - e.g directly using SMTP or via a dedicated email service.
 *
 * @param transportOption {TransportOption} the option to use depending on the environment
 * @returns the transporter to use
 */
export async function generateTransporter(transportOption: TransportOption): Promise<Transporter> {
  if (transportOption === 'aws') {
    // If deployed to AWS then use AWS SES as our transport medium
    log.info('Generating transporter: Using AWS SES')
    return createSesTransporter()
  } else {
    // In all other environments simply use Node Mailers Simple Mail Protocol
    log.info('Generating transporter: Using SMTP')
    return nodemailer.createTransport({
      host: config.smtp.connection.host,
      port: config.smtp.connection.port,
      secure: config.smtp.connection.secure,
      auth: config.smtp.connection.auth,
      tls: config.smtp.connection.tls,
    })
  }
}
