import { Document, model, Schema } from 'mongoose'
import MongooseDelete from 'mongoose-delete'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface TeamInterface {
  id: string

  name: string
  description: string

  deleted: boolean

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type TeamDoc = TeamInterface & Document<any, any, TeamInterface>

const TeamSchema = new Schema<TeamInterface>(
  {
    id: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_teams',
  },
)

TeamSchema.plugin(MongooseDelete, { overrideMethods: 'all', deletedBy: true, deletedByType: Schema.Types.ObjectId })

const TeamModel = model<TeamInterface>('v2_Team', TeamSchema)

export default TeamModel
