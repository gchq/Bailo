import { Document, model, Schema } from 'mongoose'

export interface MigrationMetadata {
  [key: string]: any
}

export interface Migration {
  name: string
  metadata?: MigrationMetadata

  createdAt: Date
  updatedAt: Date
}

export type MigrationDoc = Migration & Document<any, any, Migration>

const MigrationSchema = new Schema<Migration>(
  {
    name: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
)

const MigrationModel = model<Migration>('Migration', MigrationSchema)

export default MigrationModel
