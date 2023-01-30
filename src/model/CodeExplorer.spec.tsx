/**
 * @jest-environment jsdom
 */

import { render, screen, waitFor } from '@testing-library/react'
import { ThemeProvider } from '@mui/material/styles'
import * as versionData from '../../data/version'
import CodeExplorer from './CodeExplorer'
import { lightTheme } from '../theme'

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

    const getVersionFileListSpy = jest.spyOn(versionData, 'useGetVersionFileList')
    getVersionFileListSpy.mockReturnValue(fileListData)

    const fileContentsData: any = {
      file: 'Hello, world!',
    }

    const getVersionFileSpy = jest.spyOn(versionData, 'useGetVersionFile')
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
      expect(await screen.findByText('Model.py')).not.toBeUndefined()

      const grid = container.querySelector('[data-uri="file:///Model.py"]')
      expect(grid).not.toBeUndefined()
    })
  })
})
