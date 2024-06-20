import ResponseModel, { ReactionKindKeys, ResponseReaction } from '../models/Response.js'
import { UserInterface } from '../models/User.js'
import { toEntity } from '../utils/entity.js'
import { Forbidden, NotFound } from '../utils/error.js'

export async function findResponseById(responseId: string) {
  const response = await ResponseModel.findOne({
    _id: responseId,
  })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { responseId })
  }

  return response
}

export async function getResponsesByParentIds(_user: UserInterface, parentIds: string[]) {
  const responses = await ResponseModel.find({ parentId: { $in: parentIds } })

  if (!responses) {
    throw NotFound(`The requested response was not found.`, { parentIds })
  }

  return responses
}

export async function getResponseById(user: UserInterface, responseId: string) {
  const response = await ResponseModel.findOne({ _id: responseId })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { responseId })
  }

  if (response.entity !== toEntity('user', user.dn)) {
    throw Forbidden('Only the original author can update a comment or review response.', {
      userDn: user.dn,
      responseId,
    })
  }

  return response
}

export async function findResponsesByIds(_user: UserInterface, responseIds: string[]) {
  const responses = await ResponseModel.find({ _id: { $in: responseIds } })

  if (!responses) {
    throw NotFound(`The requested response was not found.`, { responseIds })
  }

  return responses
}

export async function updateResponse(user: UserInterface, responseId: string, comment: string) {
  const response = await ResponseModel.findOne({ _id: responseId })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { responseId })
  }

  if (response.entity !== toEntity('user', user.dn)) {
    throw Forbidden('Only the original author can update a comment or review response.', {
      userDn: user.dn,
      responseId,
    })
  }

  response.comment = comment
  response.save()

  return response
}

export async function updateResponsReaction(user: UserInterface, responseId: string, kind: ReactionKindKeys) {
  const response = await ResponseModel.findOne({ _id: responseId })

  if (!response) {
    throw NotFound(`The requested response was not found.`, { responseId })
  }

  if (response.reactions === undefined) {
    response.reactions = []
  }

  const updatedReaction = response.reactions.find((reaction) => reaction.kind === kind)

  if (!updatedReaction) {
    const newReaction: ResponseReaction = {
      kind,
      users: [user.dn],
    }
    response.reactions.push(newReaction)
  } else {
    updatedReaction.users.includes(user.dn)
      ? (updatedReaction.users = updatedReaction.users.filter((reactionUser) => reactionUser !== user.dn))
      : updatedReaction.users.push(user.dn)
  }

  response.save()

  return response
}
