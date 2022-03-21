import { ensureUserRole } from '../../utils/user'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { BadReq, NotFound } from '../../utils/result'
import { findModelById } from '../../services/model'
import { findUsers, getUserById, getUserByInternalId } from '../../services/user'
import _ from 'lodash'
import { Model, User } from '../../../types/interfaces'

const modelSubset = (model: Model) => {
  return _.pick(model, ['_id', 'uuid', 'schemaRef'])
}

const userSubset = (user: User) => {
  return _.pick(user, ['_id', 'id', 'email'])
}

export const getUsers = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const users = await findUsers()
    const userSubsets = users.map((user) => {
      return userSubset(user)
    })
    req.log.info({ users: userSubsets }, 'Getting list of all users')
    return res.json({
      users,
    })
  },
]

export const getLoggedInUser = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const _id = req.user!._id
    const user = await getUserByInternalId(_id)
    req.log.info('Getting logged in user details')
    return res.json(user)
  },
]

export const postRegenerateToken = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const token = uuidv4()

    req.log.info('User requested token')

    req.user!.token = token
    await req.user!.save()

    return res.json({ token })
  },
]

export const favouriteModel = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const modelId = req.params.id

    if (typeof modelId !== 'string') {
      throw BadReq({}, `Model ID must be a string`)
    }

    const user = await getUserById(req.user!.id)
    const model = await findModelById(req.user!, modelId)

    if (user.favourites.includes(modelId)) {
      // model already favourited
      return res.json(user)
    }

    if (!model) {
      throw NotFound({ modelId }, `Unable to favourite model '${modelId}'`)
    }

    await user.favourites.push(modelId)
    await user.save()
    req.log.info({ model: modelSubset(model) }, 'User favourites model')
    return res.json(user)
  },
]

export const unfavouriteModel = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const modelId = req.params.id

    if (typeof modelId !== 'string') {
      throw BadReq({}, `Model ID must be a string`)
    }

    const user = await getUserById(req.user!.id)
    const model = await findModelById(req.user!, modelId)

    if (!user.favourites.includes(modelId)) {
      // model not favourited
      return res.json(user)
    }

    if (!model) {
      throw BadReq({ modelId }, `Unable to unfavourite model '${modelId}'`)
    }

    await user.favourites.pull(modelId)
    await user.save()
    req.log.info({ model: modelSubset(model) }, 'User unfavourites model')
    return res.json(user)
  },
]
