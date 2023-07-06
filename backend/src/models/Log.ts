import { Document, model, Schema } from 'mongoose'

export interface Log {
  id?: string

  createdAt: Date
  updatedAt: Date
}

export type LogDoc = Log & Document<any, any, Log>

const LogSchema = new Schema<Log>(
  {
    id: { type: String },
  },
  {
    timestamps: true,
    capped: { size: 1024 * 1024 * 32 },
    strict: false,
  }
)

const LogModel = model<Log>('Log', LogSchema)

export async function logCreateIndexes() {
  LogSchema.index({ '$**': 'text' })
  await LogModel.createIndexes()
}

export default LogModel
