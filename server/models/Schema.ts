import { Schema, model } from 'mongoose'

const SchemaSchema = new Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    reference: { type: String, required: true, unique: true },
    schema: { type: Schema.Types.Mixed, required: true },
    use: { type: String, required: true, enum: ['UPLOAD', 'DEPLOYMENT'] },
  },
  {
    timestamps: true,
  }
)

const SchemaModel = model('Schema', SchemaSchema)
SchemaModel.createIndexes()

export default SchemaModel
