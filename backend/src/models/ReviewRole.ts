import { model, Schema } from 'mongoose'
import MongooseDelete, { SoftDeleteDocument } from 'mongoose-delete'

import { RoleKindKeys } from '../types/types.js'
import { CollaboratorRolesKeys } from './Model.js'

export interface ReviewRoleInterface {
  id: string
  name: string
  short: string
  kind: RoleKindKeys
  description?: string
  defaultEntities?: string[]
  lockEntities?: boolean
  collaboratorRole?: CollaboratorRolesKeys
}

export type ReviewRoleDoc = ReviewRoleInterface & SoftDeleteDocument

const ReviewRoleSchema = new Schema<ReviewRoleDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, unique: true, index: true },
    short: { type: String, required: true, unique: true, index: true },
    kind: { type: String, required: true },
    description: { type: String },
    defaultEntities: [{ type: String }],
    lockEntities: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    collection: 'v2_review_roles',
  },
)

ReviewRoleSchema.plugin(MongooseDelete, {
  overrideMethods: 'all',
  deletedBy: true,
  deletedByType: Schema.Types.ObjectId,
  deletedAt: true,
})

const ReviewRoleModel = model<ReviewRoleDoc>('v2_Review_Role', ReviewRoleSchema)

export default ReviewRoleModel
