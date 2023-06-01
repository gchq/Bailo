import { render, screen, waitFor, useState } from '@testing-library/react'
import { describe, expect, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Stack } from '@mui/system'
import FileInput from 'src/common/FileInput'


import { useGetUiConfig } from '../../data/uiConfig'
import { doNothing } from '../../utils/testUtils'

import FormImport from './FormImport'
import Form from './Form'
import { Tab } from '@mui/material'

vi.mock('../../data/uiConfig', () => ({
    useGetUiConfig: vi.fn(),
}))

describe('FormImport', () => {
    it('renders Import Model tab', async () => {
     render(<Tab label='Import Model' value='import' id='ImportModel'/>)
      
     await waitFor(async () => {
        expect(await screen.findByText('Import Model')).not.toBeUndefined()
      })
    })
})

describe('Imports a model', () => {
    const testZipFile = 'testZipFile.zip'
    const [uploadModel, setUploadModel] = useState<any>()
    const handleModelChange = (e) => {
      const uploadFile = e.target.files[0]
      if (uploadFile && uploadFile.name.endsWith('.zip')) {
          setUploadModel(uploadFile)
          setError('')
          setUploadError(false)
      } else { 
          setError('Ensure you select a .zip file using Select Model');
          setUploadModel(null)
          setUploadError(true)
      }
  }
    
    it('renders Import Model tab', async () => {
     render( 
     <>
     <Tab label='Import Model' value='import' id='ImportModel'/>
     <Box sx={{ py: 4 }} key={'import'}>
            <Button>
                <Stack direction='row' spacing={2} alignItems='center'>
                    <FileInput label='Select Model' file={uploadModel} onChange={(event) => handleModelChange(event)} accepts='.zip' />
                 </Stack>
            </Button>
          </Box>
    </>
     )

     await waitFor(async () => {
        userEvent.click(screen.getByText('Select Model'))
        expect(await screen.getByTestId(testZipFile)).not.toBeUndefined()
      })
    })
})