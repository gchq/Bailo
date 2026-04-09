import type { ClientSession } from 'mongoose'

import type { TransactionCallback } from '../transactions.js'

export async function execute<T extends any[]>(
  actions: { [K in keyof T]: TransactionCallback<T[K]> },
  session?: ClientSession,
): Promise<T> {
  const results = [] as unknown as T
  for (const [i, callback] of actions.entries()) {
    results[i] = await callback(session)
  }
  return results
}

export async function useTransaction<T extends any[]>(actions: {
  [K in keyof T]: TransactionCallback<T[K]>
}): Promise<T> {
  return execute(actions)
}
