import { Types } from 'mongoose'
import { VersionDoc } from '../../server/models/Version'

const isVersionDoc = (value: VersionDoc | Types.ObjectId | undefined): value is VersionDoc =>
  !!value && (value as VersionDoc).createdAt !== undefined

export default isVersionDoc
