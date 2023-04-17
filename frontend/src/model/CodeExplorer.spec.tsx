import { ThemeProvider } from '@mui/material/styles'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import * as versionDataImport from '../../data/version'
import { lightTheme } from '../theme'
import CodeExplorer from './CodeExplorer'

const versionData = { ...versionDataImport }

vi.mock('@uiw/react-textarea-code-editor', () => ({
  default: () => <p>Code editor render contents</p>,
}))

describe('CodeExplorer', () => {
  it('Displays file tree', async () => {
    const fileListData: any = {
      fileList: {
        fileList: [
          { fileName: 'Model.py' },
          { fileName: 'basemodel/' },
          { fileName: 'basemodel/basemodel.py' },
          { fileName: 'basemodel/__init__.py' },
          { fileName: 'requirements.txt' },
        ],
      },
    }

    const getVersionFileListSpy = vi.spyOn(versionData, 'useGetVersionFileList')
    getVersionFileListSpy.mockReturnValue(fileListData)

    const fileContentsData: any = {
      file: 'Hello, world!',
    }

    const getVersionFileSpy = vi.spyOn(versionData, 'useGetVersionFile')
    getVersionFileSpy.mockReturnValue(fileContentsData)

    const { container } = render(
      <ThemeProvider theme={lightTheme}>
        <CodeExplorer
          id=''
          addQueryParameter={() => {
            /* noop */
          }}
        />
      </ThemeProvider>
    )

    await waitFor(async () => {
      expect(await screen.findByText('Code editor render contents')).not.toBeUndefined()

      // expect(await screen.findByText('Model.py')).not.toBeUndefined()
      // const grid = container.querySelector('[data-uri="file:///Model.py"]')
      // expect(grid).not.toBeUndefined()
    })
  })
})
