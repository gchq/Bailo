import { describe, expect, test, vi } from 'vitest'

vi.unmock('../../src/models/StroomEvent.ts')
import StroomEventModel, { StroomEventObject } from '../../src/models/StroomEvent.js'

const event = { EventDetail: { TypeId: 'ViewUserToken' } } as unknown as StroomEventObject

describe('models > StroomEvent', () => {
  test('event > is stored as a JSON string and read back as an object', () => {
    const stroomEvent = new StroomEventModel({ event })

    expect(stroomEvent.get('event', null, { getters: false })).toBe(JSON.stringify(event))
    expect(stroomEvent.event).toEqual(event)
  })
})
