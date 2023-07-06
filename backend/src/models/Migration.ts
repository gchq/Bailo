import { Document, model, Schema } from 'mongoose'

export interface Migration {
  name: string

  createdAt: Date
  updatedAt: Date
}

export type MigrationDoc = Migration & Document<any, any, Migration>

const MigrationSchema = new Schema<Migration>(
  {
    name: { type: String, required: true },
  },
  {
    timestamps: true,
  }
)

const MigrationModel = model<Migration>('Migration', MigrationSchema)

export default MigrationModel
