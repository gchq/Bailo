import { Request, Response } from 'express'
import { ensureUserRole } from '../../utils/user.js'
import generateDocsMenuContent from '../../services/docs.js'

const getDocsMenuContent = [
  ensureUserRole('user'),
  async (_: Request, res: Response) => {
    const docsMenuContent = await generateDocsMenuContent()
    return res.json(docsMenuContent)
  },
]

export default getDocsMenuContent
