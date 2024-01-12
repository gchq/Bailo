import { Document, model, Schema } from 'mongoose'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface UserInterface {
  // Do not store user role information on this object.  This information
  // should be stored in an external corporate store.
  dn: string
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type UserDoc = UserInterface & Document<any, any, UserInterface>

const UserSchema = new Schema<UserInterface>(
  {
    dn: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: true,
    collection: 'v2_users',
  },
)

const UserModel = model<UserInterface>('v2_User', UserSchema)

export default UserModel
