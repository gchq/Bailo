import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, vi } from 'vitest'

import { useGetUiConfig } from '../../data/uiConfig'
import { doNothing } from '../../utils/testUtils'
import FormImport from './FormImport'

vi.mock('../../data/uiConfig', () => ({
    useGetUiConfig: vi.fn(),
}))

describe('FormImport', () => {
    it('renders Import Model tab', async () => {
     render()
      }