import { ThemeProvider } from '@mui/material/styles'
import { fireEvent, render, screen } from '@testing-library/react'
import { type FormEvent } from 'react'
import FolderNavigableList from 'src/common/FolderNavigableList'
import { SortingDirection, type SortingDirectionKeys } from 'src/common/Paginate'
import { lightTheme } from 'src/theme'
import { type FileInterface } from 'types/types'
import { describe, expect, it, vi } from 'vitest'

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

  it('does not submit a surrounding form when navigating with the breadcrumbs', () => {
    const onSubmit = vi.fn((event: FormEvent) => event.preventDefault())
    render(
      <ThemeProvider theme={lightTheme}>
        <form onSubmit={onSubmit}>
          <FolderNavigableList files={[testFile('123/abc/foo.txt')]}>
            {({ data, onNavigate }) =>
              data.kind === 'folder' ? (
                <span onClick={() => onNavigate(data.node.fullPath)}>{data.name}</span>
              ) : (
                <span>{data.name}</span>
              )
            }
          </FolderNavigableList>
        </form>
      </ThemeProvider>,
    )

    fireEvent.click(screen.getByText('123'))
    fireEvent.click(screen.getByText('abc'))
    fireEvent.click(screen.getByRole('button', { name: '123' }))
    fireEvent.click(screen.getByRole('button', { name: 'Root' }))

    expect(screen.queryByText('abc')).toBeNull()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
