import VersionModel from '../../models/Version'
import { Request, Response } from 'express'
import { ensureUserRole } from '../../utils/user'
import bodyParser from 'body-parser'
import { createVersionRequests } from '../../services/request'

export const getVersion = [
  ensureUserRole('user'),
  async (req: Request, res: Response) => {
    const { id } = req.params

    const version = await VersionModel.findOne({ _id: id })

    if (!version) {
      req.log.warn({ versionId: id }, 'Unable to find version')
      return res.status(404).json({
        message: `Unable to find version '${id}'`,
      })
    }

    return res.json(version)
  },
]

export const putVersion = [
  ensureUserRole('user'),
  bodyParser.json(),
  bodyParser.urlencoded({ extended: true }),
  async (req: Request, res: Response) => {
    const { id } = req.params
    const metadata = req.body

    const version = await VersionModel.findOne({ _id: id }).populate('model')

    if (!version) {
      return res.status(404).json({
        message: `Unable to find version '${id}'`,
      })
    }

    if (req.user?.id !== version.metadata.contacts.uploader) {
      return res.status(403).json({
        message: "User does not have permission to edit another user's form.",
      })
    }

    version.metadata = metadata
    version.managerApproved = 'No Response'
    version.reviewerApproved = 'No Response'

    await version.save()

    req.log.info('Creating version requests')
    const requests = await createVersionRequests({ version })

    return res.json(version)
  },
]
