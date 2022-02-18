import { ensureUserRole } from '../../utils/user'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import UserModel from '../../models/User'
import logger from '../../utils/logger'
import ModelModel from '../../models/Model'
import { BadReq, NotFound } from '../../utils/result'

export const getUsers = [
  ensureUserRole('user'),
  async (_req: Request, res: Response) => {
    const users = await UserModel.find({}).select('-token')
    return res.json({
      users,
    })
  },
]

export const getLoggedInUser = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const _id = req.user!._id
    const user = await UserModel.findOne({ _id })
    return res.json(user)
  },
]

export const postRegenerateToken = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const token = uuidv4()

    logger.info({ userId: req.user!.id }, 'User requested token')

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

    const user = await UserModel.findOne({ id: req.user!.id })
    const model = await ModelModel.findById({ _id: modelId })

    if (user.favourites.includes(modelId)) {
      // model already favourited
      return res.json(user)
    }

    if (!model) {
      throw NotFound({ modelId }, `Unable to favourite model '${modelId}'`)
    }

    await user.favourites.push(modelId)
    await user.save()
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

    const user = await UserModel.findOne({ id: req.user!.id })
    const model = await ModelModel.findById({ _id: modelId })

    if (!user.favourites.includes(modelId)) {
      // model not favourited
      return res.json(user)
    }

    if (!model) {
      throw BadReq({ modelId }, `Unable to unfavourite model '${modelId}'`)
    }

    await user.favourites.pull(modelId)
    await user.save()
    return res.json(user)
  },
]
