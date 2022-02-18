import { ensureUserRole } from '../../utils/user'
import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import UserModel from '../../models/User'
import logger from '../../utils/logger'
import ModelModel from '../../models/Model'
import { BadReq } from '../../utils/result'

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
    const user = await UserModel.findOne({ id: req.user!.id })
    const modelId = req.params.id
    const model = await ModelModel.findById({ _id: modelId })
    if (model === undefined || user.favourites.includes(modelId)) {
      throw BadReq({ modelId }, `Unable to favourite model '${modelId}'`)
    } else {
      await user.favourites.push(modelId)
      await user.save()
      return res.json(user)
    }
  },
]

export const unfavouriteModel = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const user = await UserModel.findOne({ id: req.user!.id })
    const modelId: any = req.params.id
    const model = await ModelModel.findById({ _id: modelId })
    if (model === undefined || !user.favourites.includes(modelId)) {
      throw BadReq({ modelId }, `Unable to unfavourite model '${modelId}'`)
    } else {
      await user.favourites.pull(modelId)
      await user.save()
      return res.json(user)
    }
  },
]
