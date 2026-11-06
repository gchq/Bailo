import { configure } from '@testing-library/react'
import { vi } from 'vitest'

configure({ testIdAttribute: 'data-test' })

vi.mock('next/router', () => import('next-router-mock'))

export function doNothing() {
  /* Do nothing */
}
