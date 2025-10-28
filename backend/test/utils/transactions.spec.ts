import mongoose, { ClientSession } from 'mongoose'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { execute, useTransaction } from '../../src/utils/transactions.js'

const callback = async (mirror: any) => {
  return Promise.resolve(mirror)
}

const errorCallback = async (_: any) => {
  throw Error()
}

const utilsDb = vi.hoisted(() => {
  return { isTransactionsEnabled: vi.fn() }
})

vi.mock('../../src/utils/database.js', () => {
  return {
    isTransactionsEnabled: utilsDb.isTransactionsEnabled,
  }
})

describe('utils => transactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(mongoose.Connection.prototype, 'transaction').mockImplementation(async function (fn) {
      return await fn({} as ClientSession)
    })
    utilsDb.isTransactionsEnabled.mockReturnValue(false)
  })

  afterEach(() => {
    if (utilsDb.isTransactionsEnabled.mockRestore) {
      utilsDb.isTransactionsEnabled.mockRestore()
    }
    vi.restoreAllMocks()
  })

  it('executes callbacks and returns the appropriate results', async () => {
    const [trueResult, falseResult, undefinedResult] = await execute([
      (_) => callback(true),
      (_) => callback(false),
      (_) => callback(undefined),
    ])
    expect(trueResult).toBe(true)
    expect(falseResult).toBe(false)
    expect(undefinedResult).toBe(undefined)
  })

  it('handles errors inside the callbacks appropriately', async () => {
    await expect(
      execute([(_) => callback(true), (_) => callback(false), (_) => callback(undefined), (_) => errorCallback(_)]),
    ).rejects.toThrowError()
  })

  it('runs regular actions without a session when transactions disabled', async () => {
    const [trueResult, falseResult, undefinedResult] = await useTransaction([
      (_) => callback(true),
      (_) => callback(false),
      (_) => callback(undefined),
    ])
    expect(trueResult).toBe(true)
    expect(falseResult).toBe(false)
    expect(undefinedResult).toBe(undefined)

    expect(mongoose.connection.transaction).not.toHaveBeenCalled()
  })

  it('throws if an error happens outside transactions', async () => {
    await expect(useTransaction([(_) => errorCallback(_)])).rejects.toThrowError()
  })

  it('runs actions inside a transaction when enabled', async () => {
    utilsDb.isTransactionsEnabled.mockReturnValue(true)
    const results = await useTransaction([(_) => callback(true), (_) => callback(false), (_) => callback(undefined)])
    const [trueResult, falseResult, undefinedResult] = results
    expect(trueResult).toBe(true)
    expect(falseResult).toBe(false)
    expect(undefinedResult).toBe(undefined)

    expect(mongoose.connection.transaction).toHaveBeenCalledOnce()
  })

  it('throws error when running actions inside a transaction', async () => {
    utilsDb.isTransactionsEnabled.mockReturnValue(true)
    await expect(
      useTransaction([
        (_) => callback(true),
        (_) => callback(false),
        (_) => callback(undefined),
        (_) => errorCallback(_),
      ]),
    ).rejects.toThrowError()

    expect(mongoose.connection.transaction).toHaveBeenCalledOnce()
  })
})
