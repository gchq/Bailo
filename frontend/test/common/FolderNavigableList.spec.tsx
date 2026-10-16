import { ThemeProvider } from '@mui/material/styles'
import { render, screen } from '@testing-library/react'
import FolderNavigableList from 'src/common/FolderNavigableList'
import { SortingDirection, SortingDirectionKeys } from 'src/common/Paginate'
import { lightTheme } from 'src/theme'
import { FileInterface } from 'types/types'
import { describe, expect, it } from 'vitest'

function testFile(name: string): FileInterface {
  return {
    _id: `id-${name}`,
    modelId: 'test-model',
    name,
    mime: 'text/plain',
    path: `beta/${name}`,
    size: 100,
    complete: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  } as unknown as FileInterface
}

function renderList(files: FileInterface[], defaultSortDirection?: SortingDirectionKeys) {
  return render(
    <ThemeProvider theme={lightTheme}>
      <FolderNavigableList files={files} defaultSortDirection={defaultSortDirection}>
        {({ data }) => <span data-test='row'>{`${data.kind}:${data.name}`}</span>}
      </FolderNavigableList>
    </ThemeProvider>,
  )
}

describe('FolderNavigableList', () => {
  it('groups folders above files regardless of the sort direction', () => {
    renderList([testFile('alpha.txt'), testFile('zeta.txt'), testFile('configs/a.json'), testFile('weights/b.bin')])

    const rows = screen.getAllByTestId('row').map((row) => row.textContent)

    // The default sort is by name descending, so names read Z->A within each group,
    // but folders must still come first.
    expect(rows).toEqual(['folder:weights', 'folder:configs', 'file:zeta.txt', 'file:alpha.txt'])
  })

  it('keeps folders above files when sorted in the opposite direction', () => {
    renderList(
      [testFile('alpha.txt'), testFile('zeta.txt'), testFile('configs/a.json'), testFile('weights/b.bin')],
      SortingDirection.ASC,
    )

    const rows = screen.getAllByTestId('row').map((row) => row.textContent)

    expect(rows).toEqual(['folder:configs', 'folder:weights', 'file:alpha.txt', 'file:zeta.txt'])
  })
})
