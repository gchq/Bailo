import { NextFunction, Request, Response } from 'express'
import { MatchFunction } from 'path-to-regexp'

import { getModelById } from '../../services/model.js'
import { BadReq } from '../../utils/error.js'

export type AllowList =
  | {
      allow: { url: MatchFunction<Partial<Record<string, string | string[]>>>; method: string[] }[]
      allowAll?: never
    }
  | {
      allow?: never
      allowAll: true
    }

export function entryKindCheck(allowList: { model: AllowList; 'data-card': AllowList; mirroredModel: AllowList }) {
  return async function (req: Request, res: Response, next: NextFunction) {
    const entry = await getModelById(req.user, req.params.modelId)
    const entryAllowList = allowList[entry.kind]
    if (entryAllowList.allowAll) {
      return next()
    } else if (
      entryAllowList.allow &&
      entryAllowList.allow.some((item) => item.method.includes(req.method) && item.url(req.path))
    ) {
      return next()
    }
    throw BadReq('Deny')
  }
}
