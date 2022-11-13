import { Document, model, Schema } from 'mongoose'

export interface Log {
  createdAt: Date
  updatedAt: Date
}

export type LogDoc = Log & Document<any, any, Log>

const LogSchema = new Schema<Log>(
  {},
  {
    timestamps: true,
    capped: { size: 1024 * 1024 * 32, autoIndexId: true },
    strict: false,
  }
)

const LogModel = model<Log>('Log', LogSchema)

export async function logCreateIndexes() {
  LogSchema.index({ '$**': 'text' })
  await LogModel.createIndexes()
}

export default LogModel
