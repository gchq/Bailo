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
export const createSesTransporter = async (): Promise<Transporter> => {
  const sesClient = await createSesClient()
  log.info('Creating AWS SES Transporter')
  return nodemailer.createTransport({
    SES: { sesClient, SendEmailCommand },
  })
}

/**
 * Creates a client for interacting with AWS SES
 * @returns the SES client
 */
async function createSesClient(): Promise<SESv2Client> {
  log.info('Creating AWS SES Client')
  return new SESv2Client({
    region: config.ses.region,
  })
}
