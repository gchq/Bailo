import memoize from 'memoizee'
import { Types } from 'mongoose'

import UserModel from '../models/User.js'
import { ModelId } from '../types/types.js'

interface GetUserOptions {
  includeToken?: boolean
}

export async function getUserById(id: ModelId, opts?: GetUserOptions) {
  let user = UserModel.findOne({ id })
  if (opts?.includeToken) user = user.select('+token')

  return user
}

export async function getUserByInternalId(_id: string | Types.ObjectId, opts?: GetUserOptions) {
  let user = UserModel.findById(_id)
  if (opts?.includeToken) user = user.select('+token')

  return user
}

export async function findUsers() {
  return UserModel.find({})
}

interface FindAndUpdateUserArgs {
  userId?: string
  email?: string
  data?: any
  roles?: Array<string>
}

export async function findAndUpdateUser({ userId, email, data, roles }: FindAndUpdateUserArgs) {
  // findOneAndUpdate is atomic, so we don't need to worry about
  // multiple threads calling this simultaneously.
  return UserModel.findOneAndUpdate(
    { $or: [{ id: userId }, { email }] },
    { id: userId, email, data, roles }, // upsert docs
    { new: true, upsert: true }
  )
}

export const findUserCached = memoize(findAndUpdateUser, {
  promise: true,
  maxAge: 5000,
  normalizer: (args: [FindAndUpdateUserArgs]) => JSON.stringify(args),
})
