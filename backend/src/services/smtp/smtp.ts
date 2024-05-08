import nodemailer, { Transporter } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer/index.js'

import authentication from '../../connectors/authentication/index.js'
import { AccessRequestDoc } from '../../models/AccessRequest.js'
import { ReleaseDoc } from '../../models/Release.js'
import { ReviewDoc } from '../../models/Review.js'
import config from '../../utils/config.js'
import { toEntity } from '../../utils/entity.js'
import log from '../log.js'
import { buildEmail, EmailContent } from './emailBuilder.js'

let transporter: undefined | Transporter = undefined

async function dispatchEmail(entity: string, emailContent: EmailContent) {
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

const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
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
      {
        title: 'Created By',
        data: (await authentication.getUserInformation(toEntity('user', release.createdBy))).name || release.createdBy,
      },
    ],
    [
      { name: 'Open Release', url: getReleaseUrl(release) },
      { name: 'See Reviews', url: `${appBaseUrl}/review` },
    ],
  )

  await dispatchEmail(entity, emailContent)
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
      {
        title: 'Created By',
        data:
          (await authentication.getUserInformation(toEntity('user', accessRequest.createdBy))).name ||
          accessRequest.createdBy,
      },
    ],
    [
      {
        name: 'Open Access Request',
        url: getAccessRequestUrl(accessRequest),
      },
      { name: 'See Reviews', url: `${appBaseUrl}/review` },
    ],
  )

  await dispatchEmail(entity, emailContent)
}

export async function notifyReviewResponseForRelease(review: ReviewDoc, release: ReleaseDoc) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }
  const reviewResponse = review.responses[0]

  if (!reviewResponse) {
    log.info('response not found')
    return
  }

  const emailContent = buildEmail(
    `Release ${release.semver} has been reviewed by ${
      (await authentication.getUserInformation(toEntity('user', reviewResponse?.user))).name || reviewResponse?.user
    }`,
    [
      { title: 'Model ID', data: release.modelId },
      { title: 'Reviewer Role', data: review.role.toUpperCase() },
      { title: 'Decision', data: reviewResponse.decision.replace(/_/g, ' ') },
    ],
    [
      { name: 'Open Release', url: getReleaseUrl(release) },
      { name: 'See Reviews', url: `${appBaseUrl}/review` },
    ],
  )
  await dispatchEmail(toEntity('user', release.createdBy), emailContent)
}

export async function notifyReviewResponseForAccess(review: ReviewDoc, accessRequest: AccessRequestDoc) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }
  const reviewResponse = review.responses[0]

  if (!reviewResponse) {
    log.info('response not found')
    return
  }
  const emailContent = buildEmail(
    `Access request for model ${accessRequest.modelId} has been reviewed by ${
      (await authentication.getUserInformation(toEntity('user', reviewResponse?.user))).name || reviewResponse?.user
    }`,
    [
      { title: 'Model ID', data: accessRequest.modelId },
      { title: 'Reviewer Role', data: review.role.toUpperCase() },
      { title: 'Decision', data: reviewResponse.decision.replace(/_/g, ' ') },
    ],
    [
      { name: 'Open Access Request', url: getAccessRequestUrl(accessRequest) },
      { name: 'See Reviews', url: `${appBaseUrl}/review` },
    ],
  )
  await dispatchEmail(toEntity('user', accessRequest.createdBy), emailContent)
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
    log.warn(content, `Unable to send email`)
    return Promise.reject(`Unable to send email: ${JSON.stringify(content)}`)
  }
}

function getReleaseUrl(release: ReleaseDoc) {
  return `${appBaseUrl}/model/${release.modelId}/release/${release.semver}`
}

function getAccessRequestUrl(accessRequest: AccessRequestDoc) {
  return `${appBaseUrl}/model/${accessRequest.modelId}/access-request/${accessRequest.id}`
}
