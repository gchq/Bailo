import nodemailer, { Transporter } from 'nodemailer'

import authorisation from '../../../connectors/v2/authorisation/index.js'
import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewDoc } from '../../../models/v2/Review.js'
import { ReviewKind } from '../../../types/v2/enums.js'
import config from '../../../utils/v2/config.js'
import log from '../log.js'
import { BaseEmailTemplate } from './templates/baseEmailTemplate.js'
import { ReleaseReviewEmail } from './templates/releaseReview.js'

const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
let transporter: undefined | Transporter = undefined

export async function requestReviewForRelease(
  entity: string,
  review: ReviewDoc,
  reviewItem: ReleaseDoc | AccessRequestDoc,
) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  let title = ``
  if (review.kind === ReviewKind.Release && isReviewDoc(reviewItem)) {
    title = `Release ${reviewItem.semver} for ${reviewItem.modelId}`
  } else if (review.kind === ReviewKind.Access && isAccessRequestDoc(reviewItem)) {
    title = `Access to ${reviewItem.modelId} for ${reviewItem.entity} `
  }
  const userInfoList = await Promise.all(await authorisation.getUserInformationList(entity))
  const sendEmailResponses = userInfoList.map(async (userInfo) => {
    const email = new ReleaseReviewEmail()
    email.setTo(userInfo.email)
    email.setSubject(title, review.role)
    email.setText(review.kind, title, reviewItem.modelId, appBaseUrl, reviewItem.createdBy)
    email.setHtml(review.kind, title, reviewItem.modelId, appBaseUrl, reviewItem.createdBy)
    return await sendEmail(email)
  })
  await Promise.all(sendEmailResponses)
}

async function sendEmail(email: BaseEmailTemplate) {
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
      from: email.from, // sender address
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

function isReviewDoc(reviewItem: ReleaseDoc | AccessRequestDoc): reviewItem is ReleaseDoc {
  if (typeof reviewItem !== 'object' || reviewItem === null) {
    return false
  }
  return (reviewItem as ReleaseDoc).semver !== undefined
}

function isAccessRequestDoc(reviewItem: ReleaseDoc | AccessRequestDoc): reviewItem is AccessRequestDoc {
  if (typeof reviewItem !== 'object' || reviewItem === null) {
    return false
  }
  return (reviewItem as AccessRequestDoc).metadata !== undefined
}
