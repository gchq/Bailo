import { describe, expect, it, vi } from 'vitest'

vi.mock('utils/formUtils', () => ({
  getMirroredState: (_id: string, formContext: any) => formContext.mirroredState?._resolved,
  getCompareFromState: (_id: string, formContext: any) => formContext.compareFromState?._resolved,
  getCompareFromMirroredState: (_id: string, formContext: any) => formContext.compareFromMirroredState?._resolved,
}))

import getCompareFieldState from '../../src/hooks/useCompareField'

function makeFormContext(overrides: Record<string, unknown> = {}) {
  return {
    editMode: false,
    compareMode: false,
    mirroredModel: false,
    mirroredState: {},
    compareFromState: {},
    compareFromMirroredState: {},
    ...overrides,
  }
}

describe('getCompareFieldState', () => {
  it('returns inCompareMode true when compareMode is true and editMode is false', () => {
    const result = getCompareFieldState('root_field', makeFormContext({ compareMode: true }))
    expect(result.inCompareMode).toBe(true)
  })

  it('returns inCompareMode false when editMode is true even if compareMode is true', () => {
    const result = getCompareFieldState('root_field', makeFormContext({ compareMode: true, editMode: true }))
    expect(result.inCompareMode).toBe(false)
  })

  it('returns inCompareMode false when compareMode is false', () => {
    const result = getCompareFieldState('root_field', makeFormContext())
    expect(result.inCompareMode).toBe(false)
  })

  it('returns isMirroredModel correctly', () => {
    const mirrored = getCompareFieldState('root_field', makeFormContext({ mirroredModel: true }))
    expect(mirrored.isMirroredModel).toBe(true)

    const nonMirrored = getCompareFieldState('root_field', makeFormContext({ mirroredModel: false }))
    expect(nonMirrored.isMirroredModel).toBe(false)
  })

  it('returns inMirroredCompare true only when both inCompareMode and isMirroredModel', () => {
    const both = getCompareFieldState('root_field', makeFormContext({ compareMode: true, mirroredModel: true }))
    expect(both.inMirroredCompare).toBe(true)

    const compareOnly = getCompareFieldState('root_field', makeFormContext({ compareMode: true, mirroredModel: false }))
    expect(compareOnly.inMirroredCompare).toBe(false)
  })

  it('returns resolved state values from formContext', () => {
    const formContext = makeFormContext({
      mirroredState: { _resolved: 'mirrored-val' },
      compareFromState: { _resolved: 'from-val' },
      compareFromMirroredState: { _resolved: 'from-mirrored-val' },
    })
    const result = getCompareFieldState<string>('root_field', formContext)
    expect(result.mirroredState).toBe('mirrored-val')
    expect(result.compareFromState).toBe('from-val')
    expect(result.compareFromMirroredState).toBe('from-mirrored-val')
  })

  it('returns undefined state values when formContext has no compare data', () => {
    const formContext = makeFormContext({
      mirroredState: { _resolved: undefined },
      compareFromState: { _resolved: undefined },
      compareFromMirroredState: { _resolved: undefined },
    })
    const result = getCompareFieldState('root_field', formContext)
    expect(result.mirroredState).toBeUndefined()
    expect(result.compareFromState).toBeUndefined()
    expect(result.compareFromMirroredState).toBeUndefined()
  })
})
