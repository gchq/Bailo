import { beforeAll, vi } from 'vitest'

beforeAll(() => {
  vi.mock('next/router', () => require('next-router-mock'))
})

export function doNothing() {
  /* Do nothing */
}
