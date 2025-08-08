import mongoose, { ClientSession } from 'mongoose'

import log from '../services/log.js'
import { useTransactions } from './database.js'

export interface TransactionCallback<T> {
  (session?: ClientSession): Promise<T>
}

/**
 * Sequentially execute callbacks with an optional session. This function is intended to be called
 * from within a `transaction`, but can be used without one if a session isn't available.
 *
 * @returns result of each callback inside an array
 */
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

const transactionsNotEnabled = 'Database is not in replica set mode, cannot use transactions'

/**
 * **Transaction Helper**
 *
 * Given a list of actions to execute, this function will wrap those actions inside a database transaction
 * if transactions are allowed - see {@link useTransactions} for the conditions.
 * Otherwise, the actions will be executed as normal.
 *
 * @param actions to execute in the provided order
 * @returns the results of each action as an array
 */
export async function useTransaction<T extends any[]>(actions: {
  [K in keyof T]: TransactionCallback<T[K]>
}): Promise<T> {
  if (!useTransactions()) {
    log.trace(transactionsNotEnabled)
    return execute(actions)
  } else {
    return await mongoose.connection.transaction((session) => execute(actions, session))
  }
}
