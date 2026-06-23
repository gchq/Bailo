import nodemailer, { Transporter } from 'nodemailer'

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
import { resolveKindToUrl, toTitleCase } from '../../utils/string.js'
import log from '../log.js'
import { getModelByIdNoAuth, getRoleEntities } from '../model.js'
import { buildEmail, EmailContent, Info } from './emailBuilder.js'

const appBaseUrl = `${config.app.protocol}://${config.app.host}:${config.app.port}`
const transporter = await generateTransporter(config.smtp.transporter)
const LINE_BREAK = '<br />'

/**
 * Generates a Node Mailer Transporter.
 * This dictates how the email is sent - e.g directly using SMTP or via a dedicated email service.
 *
 * @param transportOption {TransportOption} the option to use depending on the environment
 * @returns the transporter to use
 */
async function generateTransporter(transportOption: TransportOption): Promise<Transporter> {
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

async function dispatchEmail(entities: string[], emailContent: EmailContent) {
  const userInfoLists = await Promise.all(
    entities.map(async (entity) => Promise.all(await authentication.getUserInformationList(entity))),
  )

  const uniqueEmails = [
    ...new Set(
      userInfoLists
        .flat()
        .map((userInfo) => userInfo.email)
        .filter((email) => email !== undefined),
    ),
  ]

  if (uniqueEmails.length === 0) {
    log.warn({ entities }, 'No valid recipients found; skipping email dispatch')
    return
  }

  const email = {
    from: config.smtp.from,
    bcc: uniqueEmails,
    ...emailContent,
  }
  try {
    const info = await transporter.sendMail(email)
    log.info({ messageId: info.messageId }, 'Email sent')
  } catch (error) {
    const content = { bcc: email.bcc, subject: email.subject, text: email.text }
    log.warn({ content, error }, `Unable to send email`)
    return Promise.reject(`Unable to send email: ${JSON.stringify(content)}`)
  }
}

export async function requestReviewForRelease(entities: string[], review: ReviewDoc, release: ReleaseDoc) {
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

  await dispatchEmail(entities, await emailContent)
}

const requestingEntitiesText = (value: number) => {
  return `${value} ${value === 1 ? `user/group is` : `users/groups are`}`
}

export async function requestReviewForAccessRequest(
  entities: string[],
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

  await dispatchEmail(entities, await emailContent)
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

  const model = await getModelByIdNoAuth(release.modelId)
  const reviewRoleEntities = getRoleEntities([reviewResponse.role], model.collaborators)[reviewResponse.role]
  await dispatchEmail([toEntity('user', release.createdBy), ...reviewRoleEntities], await emailContent)
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

  const ownerEntities = getRoleEntities(['owner'], model.collaborators).owner
  await dispatchEmail(ownerEntities, await emailContent)
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
  const model = await getModelByIdNoAuth(accessRequest.modelId)
  const reviewRoleEntities = getRoleEntities([reviewResponse.role], model.collaborators)[reviewResponse.role]
  await dispatchEmail([toEntity('user', accessRequest.createdBy), ...reviewRoleEntities], await emailContent)
}

export async function dispatchEmailToModelRole(modelId: string, role: string, emailContent: EmailContent) {
  const model = await getModelByIdNoAuth(modelId)
  const reviewRoleEntities = getRoleEntities([role], model.collaborators)[role]
  await dispatchEmail(reviewRoleEntities, await emailContent)
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
    const release = await ReleaseModel.findOne({
      modelId: review.modelId,
      semver: review.semver,
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

  const model = await getModelByIdNoAuth(modelId)
  const ownerEntities = getRoleEntities(['owner'], model.collaborators).owner
  await dispatchEmail(ownerEntities, await emailContent)
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

  const model = await getModelByIdNoAuth(modelId)
  const ownerEntities = getRoleEntities(['owner'], model.collaborators).owner
  await dispatchEmail(ownerEntities, await emailContent)
}

function getReleaseUrl(release: ReleaseDoc) {
  return `${appBaseUrl}/model/${release.modelId}/release/${release.semver}`
}

function getAccessRequestUrl(accessRequest: AccessRequestDoc) {
  return `${appBaseUrl}/model/${accessRequest.modelId}/access-request/${accessRequest.id}`
}
