import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import ExistingFileSelector from 'src/entry/model/releases/ExistingFileSelector'
import { lightTheme } from 'src/theme'
import { FileInterface } from 'types/types'
import { testV2Model } from 'utils/test/testModels'
import { describe, expect, it, vi } from 'vitest'

function makeFile(id: string, name: string): FileInterface {
  return {
    _id: id,
    modelId: testV2Model.id,
    name,
    mime: 'text/plain',
    path: `beta/${id}`,
    size: 100,
    complete: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as FileInterface
}

describe('scratch: is the some() dedupe bug reachable?', () => {
  it('reports whether a file already on the release can be checked alongside another', () => {
    const aTxt = makeFile('id-a', 'a.txt')
    const bTxt = makeFile('id-b', 'b.txt')
    const onChange = vi.fn()

    render(
      <ThemeProvider theme={lightTheme}>
        <ExistingFileSelector
          files={[aTxt, bTxt]}
          model={testV2Model}
          existingReleaseFiles={[aTxt]}
          onChange={onChange}
        />
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByText('Select existing files'))

    const aRow = screen.getByText('a.txt').closest('div[role="button"], .MuiButtonBase-root')

    fireEvent.click(screen.getByText('a.txt'))
    fireEvent.click(screen.getByText('b.txt'))
    fireEvent.click(screen.getByText('Add files'))

    expect({
      aRowDisabled: aRow?.className.includes('Mui-disabled'),
      onChangeCallCount: onChange.mock.calls.length,
      resultingFileNames: onChange.mock.calls[0]?.[0]?.map((f: FileInterface) => f.name),
    }).toEqual('FORCE-FAIL-TO-REVEAL')
  })
})
