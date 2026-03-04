import { model, Schema } from 'mongoose'

import { EventDetail } from '../connectors/audit/stroom.js'
import { SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export interface StroomEventObject {
  EventTime: {
    TimeCreated: string
  }
  EventSource: {
    System: {
      Name: string
      Environment: any
    }
    Generator: string
    Device: {
      IPAddress: string
    }
    User: {
      Id: string
    }
  }
  EventDetail: EventDetail
}

export interface StroomEventInterface {
  event: StroomEventObject
  batchId: string
  inFlight: boolean
  attempts: number

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides. If a function takes in an
// object from Mongoose it should use this interface
export type StroomEventInterfaceDoc = StroomEventInterface & SoftDeleteDocument

const StroomEventSchema = new Schema<StroomEventInterface>(
  {
    event: { type: String, required: true, get: getSchema, set: setSchema },
    batchId: { type: String, default: '' },
    inFlight: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    collection: 'v2_stroom_events',
    toJSON: { getters: true },
  },
)

function getSchema(schema: string) {
  return JSON.parse(schema)
}

function setSchema(schema: unknown) {
  return JSON.stringify(schema)
}

StroomEventSchema.plugin(softDeletionPlugin)

const StroomEventModel = model<StroomEventInterface>('v2_Stroom_Event', StroomEventSchema)

export default StroomEventModel
