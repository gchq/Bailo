import nodemailer, { Transporter } from 'nodemailer'
import Mail from 'nodemailer/lib/mailer/index.js'

import { createSesTransporter } from '../../clients/ses.js'
import authentication from '../../connectors/authentication/index.js'
import AccessRequestModel, { AccessRequestDoc } from '../../models/AccessRequest.js'
import ReleaseModel, { ReleaseDoc } from '../../models/Release.js'
import { ResponseInterface } from '../../models/Response.js'
import { ReviewDoc, ReviewInterface } from '../../models/Review.js'
import { UserInterface } from '../../models/User.js'
import { ReviewKind } from '../../types/enums.js'
import config, { TransportOption } from '../../utils/config.js'
import { toEntity } from '../../utils/entity.js'
import { BadReq, NotFound } from '../../utils/error.js'
import { sanitiseEmail } from '../../utils/smtp.js'
import { resolveKindToUrl, toTitleCase } from '../../utils/string.js'
import log from '../log.js'
import { getModelByIdNoAuth } from '../model.js'
import { semverStringToObject } from '../release.js'
import { buildEmail, EmailContent, Info } from './emailBuilder.js'

const transporter = await generateTransporter(config.smtp.transporter)
const LINE_BREAK = '<br />'

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

export async function dispatchEmail(entity: string, emailContent: EmailContent) {
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

export async function dispatchEmailToModelRole(modelId: string, role: string, emailContent: EmailContent) {
  const model = await getModelByIdNoAuth(modelId)
  const entities = await Promise.all(
    model.collaborators
      .filter((collaborator) => collaborator.roles.includes(role))
      .map((collaborator) => authentication.getUserInformation(collaborator.entity)),
  )
  const emails = entities.map((entry) => entry.email).filter((email): email is string => email !== undefined)
  await sendEmail({ to: emails, ...emailContent })
}

const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
export async function requestReviewForRelease(entity: string, review: ReviewDoc, release: ReleaseDoc) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const emailContent = buildEmail(
    `Release ${release.semver} for model ${release.modelId} is ready for your review`,
    [
      { title: 'Model ID', data: release.modelId },
      { title: 'Semver', data: release.semver },
      { title: 'Your Role', data: review.role.toUpperCase() },
      {
        title: 'Created By',
        data: (await authentication.getUserInformation(toEntity('user', release.createdBy))).name || release.createdBy,
      },
    ],
    [
      { name: 'Open Release', url: getReleaseUrl(release) },
      { name: 'See Reviews', url: `${appBaseUrl}/review` },
    ],
    true,
  )

  await dispatchEmail(entity, await emailContent)
}

const requestingEntitiesText = (value: number) => {
  return `${value} ${value === 1 ? `user/group is` : `users/groups are`}`
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
    `${requestingEntitiesText(accessRequest.metadata.overview.entities.length)} requesting access to model ${accessRequest.modelId}`,
    [
      { title: 'Model ID', data: accessRequest.modelId },
      { title: 'Your Role', data: review.role.toUpperCase() },
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
    true,
  )

  await dispatchEmail(entity, await emailContent)
}

export async function notifyReviewResponseForRelease(reviewResponse: ResponseInterface, release: ReleaseDoc) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  if (!reviewResponse) {
    log.info('response not found')
    return
  }

  if (!reviewResponse.role) {
    log.info('response role not found')
    return
  }

  if (!reviewResponse.decision) {
    log.info('response decision not found')
    return
  }

  const emailContent = buildEmail(
    `Release ${release.semver} has been reviewed by ${
      (await authentication.getUserInformation(reviewResponse.entity)).name
    }`,
    [
      { title: 'Model ID', data: release.modelId },
      { title: 'Reviewer Role', data: reviewResponse.role.toUpperCase() },
      { title: 'Decision', data: reviewResponse.decision.replace(/_/g, ' ') },
    ],
    [
      { name: 'Open Release', url: getReleaseUrl(release) },
      { name: 'See Reviews', url: `${appBaseUrl}/review` },
    ],
  )
  await dispatchEmail(toEntity('user', release.createdBy), await emailContent)
  await dispatchEmailToModelRole(release.modelId, reviewResponse.role, await emailContent)
}

export async function notifyLifeCycleReview(modelId: string, reviewId: string, dueIn?: string) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const model = await getModelByIdNoAuth(modelId)
  const emailContent = buildEmail(
    dueIn
      ? `A lifecycle review for ${model.name} is due in ${dueIn}`
      : `A lifecycle review for ${model.name} has past it's due date`,
    [],
    [
      { name: `See ${toTitleCase(model.kind, '-')}`, url: `${appBaseUrl}/${resolveKindToUrl(model.kind)}/${modelId}` },
      {
        name: 'Review Lifecycle',
        url: `${appBaseUrl}/${model.kind}/${modelId}/lifecycle/${reviewId}/review?role=owner`,
      },
    ],
  )

  await dispatchEmailToModelRole(modelId, 'owner', await emailContent)
}

export async function notifyReviewResponseForAccess(
  reviewResponse: ResponseInterface,
  accessRequest: AccessRequestDoc,
) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  if (!reviewResponse) {
    log.info('response not found')
    return
  }

  if (!reviewResponse.role) {
    log.info('response role not found')
    return
  }

  if (!reviewResponse.decision) {
    log.info('response decision not found')
    return
  }
  const emailContent = buildEmail(
    `Access request for model ${accessRequest.modelId} has been reviewed by ${
      (await authentication.getUserInformation(reviewResponse.entity)).name
    }`,
    [
      { title: 'Model ID', data: accessRequest.modelId },
      { title: 'Reviewer Role', data: reviewResponse.role.toUpperCase() },
      { title: 'Decision', data: reviewResponse.decision.replace(/_/g, ' ') },
    ],
    [
      { name: 'Open Access Request', url: getAccessRequestUrl(accessRequest) },
      { name: 'See Reviews', url: `${appBaseUrl}/review` },
    ],
  )
  await dispatchEmail(toEntity('user', accessRequest.createdBy), await emailContent)
  await dispatchEmailToModelRole(accessRequest.modelId, reviewResponse.role, await emailContent)
}

async function notifyRole(review: ReviewInterface, title: string, fields: Info[], actionUrl: string) {
  const emailContent = await buildEmail(title, fields, [
    { name: 'Open item', url: actionUrl },
    { name: 'See Reviews', url: `${appBaseUrl}/review` },
  ])

  await dispatchEmailToModelRole(review.modelId, review.role, emailContent)
}

export async function notifyReviewRoleOfAdditionalReview(user: UserInterface, review: ReviewInterface) {
  if (review.kind === ReviewKind.Release) {
    const semverObj = semverStringToObject(review.semver)
    const release = await ReleaseModel.findOne({
      modelId: review.modelId,
      semver: semverObj,
    })

    if (!release) {
      throw NotFound(`The requested release was not found.`, { modelId: review.modelId, semver: review.semver })
    }
    await notifyRole(
      review,
      `${user.dn} has requested an additional review on a release.`,
      [
        { title: 'Model ID', data: review.modelId },
        { title: 'Release version', data: review.semver },
        { title: 'Review Role', data: review.role.toUpperCase() },
      ],
      getReleaseUrl(release),
    )
  } else if (review.kind === ReviewKind.Access) {
    const accessRequest = await AccessRequestModel.findOne({ id: review.accessRequestId })
    if (!accessRequest) {
      throw NotFound('The requested access request was not found.', { accessRequestId: review.accessRequestId })
    }
    await notifyRole(
      review,
      `${user.dn} has requested an additional review on an access request.`,
      [
        { title: 'Model ID', data: review.modelId },
        { title: 'Access request ID', data: review.accessRequestId },
        { title: 'Review Role', data: review.role.toUpperCase() },
      ],
      getAccessRequestUrl(accessRequest),
    )
  } else {
    throw BadReq('Unknown review kind given, unable to notify reviewer.', { kind: review.kind })
  }
  return
}

async function sendEmail(email: Mail.Options) {
  try {
    const sanitisedEmail = sanitiseEmail({
      from: config.smtp.from,
      ...email,
    })
    const info = await transporter.sendMail(sanitisedEmail)
    log.info({ messageId: info.messageId }, 'Email sent')
  } catch (error) {
    const content = { to: email.to, subject: email.subject, text: email.text }
    log.warn({ content, error }, `Unable to send email`)
    return Promise.reject(`Unable to send email: ${JSON.stringify(content)}`)
  }
}

export async function startImportNotification(modelId: string) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const mirroredModel = await getModelByIdNoAuth(modelId)
  const emailContent = buildEmail(
    `${mirroredModel.name} has begun importing`,
    [],
    [
      { name: 'See Model', url: `${appBaseUrl}/model/${modelId}` },
      { name: 'See Releases', url: `${appBaseUrl}/model/${modelId}?tab=releases` },
    ],
  )

  await dispatchEmailToModelRole(modelId, 'owner', await emailContent)
}

export async function transferCompleteNotification(
  modelId: string,
  failed: boolean,
  artefacts: Record<string, string[]>,
) {
  if (!config.smtp.enabled) {
    log.info('Not sending email due to SMTP disabled')
    return
  }

  const mirroredModel = await getModelByIdNoAuth(modelId)

  const title = failed
    ? `Oh no there was a problem with importing ${mirroredModel.name}!`
    : `${mirroredModel.name} has finished importing`

  const infoArray: Info[] = []
  for (const [key, values] of Object.entries(artefacts)) {
    if (values.length > 0) {
      infoArray.push({ title: key, data: values.join(LINE_BREAK) })
    }
  }

  const actions = [
    { name: 'See Model', url: `${appBaseUrl}/model/${modelId}` },
    { name: 'See Releases', url: `${appBaseUrl}/model/${modelId}?tab=releases` },
  ]

  if (failed) {
    actions.push({ name: 'Contact Support', url: config.ui.issues.contactHref })
  }

  const emailContent = buildEmail(title, infoArray, actions)

  await dispatchEmailToModelRole(modelId, 'owner', await emailContent)
}

function getReleaseUrl(release: ReleaseDoc) {
  return `${appBaseUrl}/model/${release.modelId}/release/${release.semver}`
}

function getAccessRequestUrl(accessRequest: AccessRequestDoc) {
  return `${appBaseUrl}/model/${accessRequest.modelId}/access-request/${accessRequest.id}`
}
