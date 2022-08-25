import { Request, Response } from 'express'
import { ensureUserRole } from 'server/utils/user'
import generateDocsMenuContent from '../../services/docs'

const getDocsMenuContent = [
  ensureUserRole('user'),
  (_: Request, res: Response) => {
    const docsMenuContent = generateDocsMenuContent()
    return res.json(docsMenuContent)
  },
]

export default getDocsMenuContent
