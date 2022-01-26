import { Schema, model } from 'mongoose'
import { v4 as uuidv4 } from 'uuid'
import bcrypt from 'bcryptjs'

const UserSchema = new Schema(
  {
    id: { type: String, required: true, index: true, unique: true },
    email: { type: String },

    roles: { type: [String], default: ['user'] },
    favourites: [{ type: Schema.Types.ObjectId, ref: 'Model' }],

    // uuidv4() is cryptographically safe
    token: { type: String, required: true, default: uuidv4(), select: false },
  },
  {
    timestamps: true,
  }
)

UserSchema.pre('save', function (next) {
  const user = this
  if (!user.isModified('token')) return next()

  bcrypt.hash(user.token, 10, (err, hash) => {
    if (err) return next(err)

    user.token = hash
    next()
  })
})

UserSchema.methods.compareToken = function (candidateToken) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidateToken, this.token, function (err, isMatch) {
      if (err) return reject(err)
      resolve(isMatch)
    })
  })
}

const UserModel = model('User', UserSchema)
export default UserModel
