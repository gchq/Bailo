import { Document, model, Schema } from 'mongoose'

export const SchemaMigrationKind = {
  Move: 'move',
  Delete: 'delete',
} as const
export type SchemaMigrationKindKeys = (typeof SchemaMigrationKind)[keyof typeof SchemaMigrationKind]

export interface QuestionMigration {
  id: string
  kind: SchemaMigrationKindKeys
  sourcePath: string
  targetPath?: string
  propertyType: string
}

export interface SchemaMigrationInterface {
  name: string
  id: string
  description?: string

  sourceSchema: string
  targetSchema: string

  questionMigrations: QuestionMigration[]

  createdAt: Date
  updatedAt: Date
}

export type SchemaMigrationDoc = SchemaMigrationInterface & Document<any, any, SchemaMigrationInterface>

const SchemaMigrationSchema = new Schema<SchemaMigrationInterface>(
  {
    name: { type: String, required: true },
    id: { type: String, unique: true, required: true },
    description: { type: String, required: false, default: '' },

    sourceSchema: { type: String, required: true },
    targetSchema: { type: String, required: true },

    questionMigrations: [
      {
        id: { type: String, required: true },
        kind: { type: String, enum: Object.values(SchemaMigrationKind), required: true },
        sourcePath: { type: String, required: true },
        targetPath: { type: String },
        propertyType: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: true,
    collection: 'v2_schema_migrations',
    toJSON: { getters: true },
  },
)

const SchemaMigrationModel = model<SchemaMigrationInterface>('v2_Schema_Migrations', SchemaMigrationSchema)

export default SchemaMigrationModel
