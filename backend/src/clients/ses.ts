/**
 * AWS SES (Simple Email Service) Client.
 *
 * This code handles interactions between Bailo and AWS SES.
 */

import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import nodemailer, { Transporter } from 'nodemailer'

import log from '../services/log.js'
import config from '../utils/config.js'

/**
 * Creates a Node Mailer transporter that uses AWS SES
 * @returns The created Transporter connected to SES
 */
export function createSesTransporter(): Transporter {
  const sesClient = createSesClient()
  log.info('Creating AWS SES Transporter')
  return nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  })
}

/**
 * Creates a client for interacting with AWS SES
 * @returns the SES client
 */
function createSesClient(): SESv2Client {
  return new SESv2Client({
    region: config.ses.region,
  })
}
