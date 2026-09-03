import { User } from 'types/types'
import { entitiesIncludesCurrentUser, isCurrentUserEntity } from 'utils/entityUtils'
import { describe, expect, test } from 'vitest'

const currentUser: User = { dn: 'joe', isAdmin: false }

describe('entityUtils', () => {
  describe('isCurrentUserEntity', () => {
    test.each([
      ['the entity form', 'user:joe'],
      ['a bare distinguished name', 'joe'],
    ])('matches %s', (_form, entity) => {
      expect(isCurrentUserEntity(entity, currentUser)).toBe(true)
    })

    test.each([
      ['another user', 'user:someone-else'],
      ['another bare distinguished name', 'someone-else'],
      ['a group of the same name', 'group:joe'],
    ])('does not match %s', (_description, entity) => {
      expect(isCurrentUserEntity(entity, currentUser)).toBe(false)
    })

    test('does not match when there is no current user', () => {
      expect(isCurrentUserEntity('user:joe', undefined)).toBe(false)
    })
  })

  describe('entitiesIncludesCurrentUser', () => {
    test('finds the current user anywhere in the list', () => {
      expect(entitiesIncludesCurrentUser(['user:someone-else', 'user:joe'], currentUser)).toBe(true)
    })

    test('returns false when the current user is absent', () => {
      expect(entitiesIncludesCurrentUser(['user:someone-else'], currentUser)).toBe(false)
    })

    test('returns false for an empty list', () => {
      expect(entitiesIncludesCurrentUser([], currentUser)).toBe(false)
    })
  })
})
