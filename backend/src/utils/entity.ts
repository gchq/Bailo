import { getUserById } from '../services/user.js'
import { Entity, EntityKind, ParsedEntity, UserDoc } from '../types/types.js'

export async function parseEntity(
  entity: Entity,
): Promise<{ valid: false; reason: string } | { valid: true; kind: Entity['kind']; entity: any }> {
  switch (entity.kind) {
    case 'user': {
      const user = await getUserById(entity.id)

      if (!user) {
        return {
          valid: false,
          reason: `User not found: ${entity.id}`,
        }
      }

      return {
        valid: true,
        kind: entity.kind,
        entity: user,
      }
    }
    default:
      return {
        valid: false,
        reason: `Invalid entity kind: ${entity.kind}`,
      }
  }
}

interface ParseOptions {
  relaxed: boolean
}
export async function parseEntityList(
  entities: Array<Entity>,
  opts: ParseOptions = { relaxed: false },
): Promise<{ valid: false; reason: string; entity: Entity } | { valid: true; entities: Array<any> }> {
  const parsedEntities: Array<{ kind: string; entity: any }> = []

  for (const userEntity of entities) {
    const parsedEntity = await parseEntity(userEntity)

    if (!parsedEntity.valid) {
      if (!opts.relaxed) {
        return {
          valid: false,
          reason: parsedEntity.reason,
          entity: userEntity,
        }
      }
    }

    if (parsedEntity.valid) {
      parsedEntities.push({
        kind: parsedEntity.kind,
        entity: parsedEntity.entity,
      })
    }
  }

  return {
    valid: true,
    entities: parsedEntities,
  }
}

async function getUsersFromEntity(entity: ParsedEntity) {
  switch (entity.kind) {
    case 'user':
      return [entity.entity]
    default:
      throw new Error(`Unexpected kind: ${entity.kind}`)
  }
}

export async function getUserListFromEntityList(rawEntities: Array<Entity>) {
  const parsedEntities = await parseEntityList(rawEntities, { relaxed: true })

  if (!parsedEntities.valid) {
    throw new Error('Due to relaxed parsing, this error should be unreachable.')
  }

  const users = (await Promise.all(parsedEntities.entities.map((entity) => getUsersFromEntity(entity)))).flat()

  return users
}

export async function isUserInEntityList(user: UserDoc, rawEntities: Array<Entity>) {
  const parsedEntities = await parseEntityList(rawEntities, { relaxed: true })

  if (!parsedEntities.valid) {
    throw new Error('Due to relaxed parsing, this error should be unreachable.')
  }

  for (const entity of parsedEntities.entities) {
    const users = await getUsersFromEntity(entity)

    if (users.some((entityUser) => entityUser._id.equals(user._id))) {
      return true
    }
  }

  return false
}

export async function getEntitiesForUser(user: UserDoc) {
  // at the moment, it's just the user itself!
  return [{ kind: EntityKind.USER, id: user.id }]
}
