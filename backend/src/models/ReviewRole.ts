import { type HydratedDocument, model, Schema } from 'mongoose'

import { type RoleKindKeys } from '../types/types.js'
import { type SystemRolesKeys } from './Model.js'
import { type SoftDeleteDocument, softDeletionPlugin } from './plugins/softDeletePlugin.js'

export interface ReviewRoleInterface {
  name: string
  shortName: string
  kind: RoleKindKeys
  description?: string
  defaultEntities?: string[]
  lockEntities?: boolean
  systemRole?: SystemRolesKeys
}

export type ReviewRoleDoc = HydratedDocument<ReviewRoleInterface> & SoftDeleteDocument

const ReviewRoleSchema = new Schema<ReviewRoleDoc>(
  {
    name: { type: String, required: true, unique: true, index: true },
    shortName: { type: String, required: true, unique: true, index: true },
    kind: { type: String, required: true },
    description: { type: String },
    defaultEntities: [{ type: String }],
    lockEntities: { type: Boolean, default: false },
    systemRole: { type: String },
  },
  {
    timestamps: true,
    collection: 'v2_review_roles',
  },
)

ReviewRoleSchema.plugin(softDeletionPlugin)

const ReviewRoleModel = model<ReviewRoleDoc>('v2_Review_Role', ReviewRoleSchema)

export default ReviewRoleModel
