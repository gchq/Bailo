import { configure } from '@testing-library/react'
import { vi } from 'vitest'

configure({ testIdAttribute: 'data-test' })

/* eslint-disable @typescript-eslint/no-require-imports */
vi.mock('next/router', () => require('next-router-mock'))

export function doNothing() {
  /* Do nothing */
}
