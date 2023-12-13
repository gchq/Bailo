import { NotificationEvent, NotificationEventKeys } from '../../models/v2/Notification.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import log from '../../services/v2/log.js'
import { sendWebhooks } from './webhook.js'

export type EventInformation = {
  title: string
  metadata: Array<{ name: string; data: string }>
}

export async function onCreateRelease(release: ReleaseDoc) {
  const eventContent = {
    title: `Release ${release.semver} has been created for model ${release.modelId}`,
    metadata: [
      { name: 'Model ID', data: release.modelId },
      { name: 'Semver', data: release.semver },
      { name: 'Created By', data: release.createdBy },
    ],
  }
  try {
    await sendNotifications(NotificationEvent.CreateRelease, eventContent, release.modelId)
  } catch (err) {
    log.error('Error sending notifications', err)
  }
}

async function sendNotifications(eventKind: NotificationEventKeys, event: EventInformation, modelId: string) {
  await sendWebhooks(eventKind, event, modelId)
}
