import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { findModelById } from '../../services/model'
import { findUsers, getUserById, getUserByInternalId } from '../../services/user'
import { BadReq, NotFound } from '../../utils/result'
import { ensureUserRole } from '../../utils/user'

export const getUsers = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const users = await findUsers()
    req.log.info({ code: 'fetching_users', users }, 'Getting list of all users')
    return res.json({
      users,
    })
  },
]

export const getLoggedInUser = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { _id } = req.user
    const user = await getUserByInternalId(_id)
    req.log.info({ code: 'fetching_user_details' }, 'Getting logged in user details')
    return res.json(user)
  },
]

export const postRegenerateToken = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const token = uuidv4()

    req.log.info({ code: 'user_requested_token' }, 'User requested token')

    if (req.user) {
      req.user.token = token
      await req.user.save()
    }

    return res.json({ token })
  },
]

export const favouriteModel = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const modelId = req.params.id

    if (typeof modelId !== 'string') {
      throw BadReq({ code: 'model_id_incorrect_type' }, `Model ID must be a string`)
    }

    const user = await getUserById(req.user.id)
    const model = await findModelById(req.user, modelId)

    if (!user) {
      throw BadReq({ code: 'invalid_user' }, `User does not exist '${req.user.id}'`)
    }

    if (user.favourites.includes(modelId)) {
      // model already favourited
      return res.json(user)
    }

    if (!model) {
      throw NotFound({ code: 'model_not_found', modelId }, `Unable to favourite model '${modelId}'`)
    }

    await user.favourites.push(modelId)
    await user.save()
    req.log.info({ code: 'favourited_model', model }, 'User favourites model')
    return res.json(user)
  },
]

export const unfavouriteModel = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const modelId = req.params.id

    if (typeof modelId !== 'string') {
      throw BadReq({ code: 'model_id_incorrect_type' }, `Model ID must be a string`)
    }

    const user = await getUserById(req.user.id)
    if (!user) {
      throw BadReq({ code: 'invalid_user' }, `User does not exist '${req.user.id}'`)
    }

    const model = await findModelById(req.user, modelId)

    if (!user.favourites.includes(modelId)) {
      // model not favourited
      return res.json(user)
    }

    if (!model) {
      throw BadReq({ code: 'requested_model_id_not_found', modelId }, `Unable to unfavourite model '${modelId}'`)
    }

    await user.favourites.pull(modelId)
    await user.save()
    req.log.info({ code: 'model_unfavourited', model }, 'User unfavourites model')
    return res.json(user)
  },
]
