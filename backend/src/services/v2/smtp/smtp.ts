import nodemailer, { Transporter } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer/index.js'

import authentication from '../../../connectors/v2/authentication/index.js'
import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewDoc } from '../../../models/v2/Review.js'
import config from '../../../utils/v2/config.js'
import log from '../log.js'
import { buildEmail } from './emailBuilder.js'

let transporter: undefined | Transporter = undefined

//const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
export async function requestReviewForRelease(entity: string, review: ReviewDoc, release: ReleaseDoc) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const emailContent = buildEmail(
    `Release ${release.semver} has been created for model ${release.modelId}`,
    [
      { title: 'Model ID', data: release.modelId },
      { title: 'Your Role', data: review.role.toUpperCase() },
      { title: 'Semver', data: release.semver },
      { title: 'Created By', data: release.createdBy },
    ],
    [
      { name: 'Open Release', url: 'TODO' },
      { name: 'See Reviews', url: 'TODO' },
    ],
  )

  let userInfoList = await Promise.all(await authentication.getUserInformationList(entity))
  if (userInfoList.length > 20) {
    log.info({ userListLength: userInfoList.length }, 'Refusing to send more than 20 emails. Sending 20 emails.')
    userInfoList = userInfoList.slice(0, 20)
  }
  const sendEmailResponses = userInfoList.map(
    async (userInfo) =>
      await sendEmail({
        to: userInfo.email,
        ...emailContent,
      }),
  )
  await Promise.all(sendEmailResponses)
}

export async function requestReviewForAccessRequest(
  entity: string,
  review: ReviewDoc,
  accessRequest: AccessRequestDoc,
) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const emailContent = buildEmail(
    `Request for Entities '${accessRequest.metadata.overview.entities}' access to the model '${accessRequest.modelId}'`,
    [
      { title: 'Model ID', data: accessRequest.modelId },
      { title: 'Your Role', data: review.role.toUpperCase() },
      { title: 'Entities Requesting Access', data: accessRequest.metadata.overview.entities.toString() },
      { title: 'Created By', data: accessRequest.createdBy },
    ],
    [
      { name: 'Open Access Request', url: 'TODO' },
      { name: 'See Reviews', url: 'TODO' },
    ],
  )

  let userInfoList = await Promise.all(await authentication.getUserInformationList(entity))
  if (userInfoList.length > 20) {
    log.info({ userListLength: userInfoList.length }, 'Refusing to send more than 20 emails. Sending 20 emails.')
    userInfoList = userInfoList.slice(0, 20)
  }
  const sendEmailResponses = userInfoList.map(
    async (userInfo) =>
      await sendEmail({
        to: userInfo.email,
        ...emailContent,
      }),
  )
  await Promise.all(sendEmailResponses)
}

async function sendEmail(email: Mail.Options) {
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
      from: config.smtp.from,
      ...email,
    })
    log.info({ messageId: info.messageId }, 'Email sent')
  } catch (err) {
    const content = { to: email.to, subject: email.subject, text: email.text }
    log.warn(`Unable to send email`, content)
    return Promise.reject(`Unable to send email: ${JSON.stringify(content)}`)
  }
}
