import { Request, Response } from 'express'
import { ensureUserRole } from '../../utils/user'
import generateDocsMenuContent from '../../services/docs'

const getDocsMenuContent = [
  ensureUserRole('user'),
  async (_: Request, res: Response) => {
    const docsMenuContent = await generateDocsMenuContent()
    return res.json(docsMenuContent)
  },
]

export default getDocsMenuContent
