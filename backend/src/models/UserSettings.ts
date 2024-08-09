import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface UserSettingsInterface {
  dn: string
  themeKey: string

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type UserSettingsDoc = UserSettingsInterface & Document<any, any, UserSettingsInterface>

const UserSettingsSchema = new Schema<UserSettingsInterface>(
  {
    dn: { type: String, required: true },
    themeKey: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_user_settings',
  },
)

UserSettingsSchema.plugin(MongooseDelete, { overrideMethods: 'all' })

const UserSettingsModel = model<UserSettingsInterface>('v2_User_Settings', UserSettingsSchema)

export default UserSettingsModel
