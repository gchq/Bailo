import { Document, HydratedDocument, model, Schema } from 'mongoose'

export interface MigrationMetadata {
  [key: string]: any
}

export interface MigrationInterface {
  name: string
  metadata?: MigrationMetadata

  createdAt: Date
  updatedAt: Date
}

export type MigrationDoc = HydratedDocument<MigrationInterface> & Document<any, any, MigrationInterface>

const MigrationSchema = new Schema<MigrationInterface>(
  {
    name: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  },
)

const MigrationModel = model<MigrationInterface>('Migration', MigrationSchema)

export default MigrationModel
