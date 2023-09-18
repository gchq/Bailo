import nodemailer, { Transporter } from 'nodemailer'

import authorisation from '../../../connectors/v2/authorisation/index.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewRequestDoc } from '../../../models/v2/ReviewRequest.js'
import config from '../../../utils/v2/config.js'
import log from '../log.js'
import { ReleaseReviewRequestEmail } from './templates/releaseReviewRequest.js'
import { IEmailTemplate } from './templates/baseEmailTemplate.js'
import { emailDeploymentOwnersOnVersionDeletion } from '../../deployment.js'
import { getReleaseName } from '../release.js'

const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
let transporter: undefined | Transporter = undefined

export async function requestReviewForRelease(entity: string, reviewRequest: ReviewRequestDoc, release: ReleaseDoc) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const releaseName = getReleaseName(release)
  const userInfoList = await Promise.all(await authorisation.getUserInformationList(entity))
  const sendEmailResponses = userInfoList.map(async (userInfo) => {
    const email = new ReleaseReviewRequestEmail()
    email.setTo(userInfo.email)
    email.setSubject(releaseName, reviewRequest.role)
    email.setText(releaseName, reviewRequest.kind, release.modelId, appBaseUrl, release.createdBy)
    email.setHtml(releaseName, reviewRequest.kind, release.modelId, appBaseUrl, release.createdBy)
    return await sendEmail(email)
  })
  await Promise.all(sendEmailResponses)
}

async function sendEmail(email: IEmailTemplate) {
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
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: email.html,
    })
    log.info({ messageId: info.messageId }, 'Email sent')
  } catch (err) {
    const content = { to: email.to, subject: email.subject, text: email.text }
    log.warn(`Unable to send email`, content)
    return Promise.reject(`Unable to send email: ${JSON.stringify(content)}`)
  }
}
