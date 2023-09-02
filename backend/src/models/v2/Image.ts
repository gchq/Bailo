import { Document, model, Schema } from 'mongoose'

// This interface stores information about the properties on the base object.
// It should be used for plain object representations, e.g. for sending to the
// client.
export interface ImageInterface {
  modelId: string

  namespace: string
  model: string
  version: string

  size: number

  createdAt: Date
  updatedAt: Date
}

// The doc type includes all values in the plain interface, as well as all the
// properties and functions that Mongoose provides.  If a function takes in an
// object from Mongoose it should use this interface
export type ImageInterfaceDoc = ImageInterface & Document<any, any, ImageInterface>

const ImageSchema = new Schema<ImageInterface>(
  {
    modelId: { type: String, required: true },

    namespace: { type: String, required: true },
    model: { type: String, required: true },
    version: { type: String, required: true },

    size: { type: Number, required: true },
  },
  {
    timestamps: true,
    collection: 'v2_images',
    toJSON: { getters: true },
  },
)

const ImageModel = model<ImageInterface>('v2_Image', ImageSchema)

export default ImageModel
