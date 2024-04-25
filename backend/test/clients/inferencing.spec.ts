import { describe } from 'node:test'
import { test } from 'shelljs'
import { expect, vi } from 'vitest'
import { updateInferenceService, createInferenceService } from '../../src/clients/inferencing.js'

const configMock = vi.hoisted(() => ({
  inference: {
    enabled: true,
    connection: {
      host: 'http://example.com',
    },
  },
}))

vi.mock('../../src/utils/config.js', () => ({
  __esModule: true,
  default: configMock,
}))

vi

describe('clients > inferencing', () => {
  test('createInferencing > success', async () => {

    expect(() => createInferenceService({} as any))
  })

  test('createInferencing > bad response', async () => {
    expect(() => createInferenceService({} as any)).rejects.toThrowError(/^Unrecoginsed response returned by inferencing service./)
  })

   test('createInfererencing > not found', async () => {
    expect(() => createInferenceService({} as any)).rejects.toThrowError(/^Unable to communicate with the inferencing service/)}
  })

  test('updateInferencing > success', async () => {
    expect(() => updateInferenceService({} as any)).rejects.toThrowError(/^Unable to communicate with the inferencing service/)
  })
  test('updateInferencing > bad response', async () => {
    expect(() => updateInferenceService({} as any)).rejects.toThrowError(/^Unable to communicate with the inferencing service/)
  })

  test('updateInferencing > rejected', async () => {
    expect(() => updateInferenceService({} as any)).rejects.toThrowError(/^Unable to communicate with the inferencing service/)
  })
})
