import Notification, { NotificationEvent, NotificationEventKeys } from '../../models/v2/Notification.js'
import { ReleaseDoc } from '../../models/v2/Release.js'
import log from '../../services/v2/log.js'
import { sendWebhook } from './webhook.js'

export type EventInformation = {
  title: string
  metadata: Array<{ name: string; data: string }>
}

export async function sendNotifications(event: NotificationEventKeys, modelId: string, artefact: unknown) {
  try {
    const query = {
      modelId,
      // Match documents where the element exists in the array
      events: event,
    }
    const notifications = await Notification.find(query)

    await Promise.all(
      notifications.map(async (notification) => {
        // TODO return if notification is not active
        const eventContent = getEventContent(event, artefact)
        //TODO allow for sending notifications of different types
        return sendWebhook(event, notification, eventContent)
      }),
    )
  } catch (error) {
    log.error(error)
  }
}

function getEventContent(event: NotificationEventKeys, artefact: unknown): EventInformation {
  switch (event) {
    case NotificationEvent.CreateRelease: {
      const release = artefact as ReleaseDoc
      return {
        title: `Release ${release.semver} has been created for model ${release.modelId}`,
        metadata: [
          { name: 'Model ID', data: release.modelId },
          { name: 'Semver', data: release.semver },
          { name: 'Created By', data: release.createdBy },
        ],
      }
    }
    //TODO Add default case
  }
}
