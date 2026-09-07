import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import ReleaseAssetsAccordion from '../../../../src/entry/model/releases/ReleaseAssetsAccordion'
import { EntryInterface, ReleaseInterface } from '../../../../types/types'

vi.mock('../../../../src/common/Paginate', () => ({ default: () => null }))
vi.mock('../../../../src/entry/model/files/FileDisplay', () => ({ default: () => null }))

describe('ReleaseAssetsAccordion', () => {
  it('offers a single archive download for all release files', async () => {
    const user = userEvent.setup()
    const model = { id: 'model-123' } as EntryInterface
    const release = {
      semver: '1.2.3',
      files: [{ _id: 'file-a', name: 'alpha.txt' }],
      images: [],
    } as unknown as ReleaseInterface

    render(<ReleaseAssetsAccordion model={model} release={release} mode='readonly' />)
    await user.click(screen.getByText('Show 1 file'))

    const link = screen.getByRole('link', { name: 'Download all files' })
    expect(link.getAttribute('href')).toBe('/api/v2/model/model-123/release/1.2.3/files/download')
  })
})
