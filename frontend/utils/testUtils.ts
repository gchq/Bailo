import { configure } from '@testing-library/react'
import { beforeAll, vi } from 'vitest'

configure({ testIdAttribute: 'data-test' })

beforeAll(() => {
  vi.mock('next/router', () => require('next-router-mock'))
})

export function doNothing() {
  /* Do nothing */
}
