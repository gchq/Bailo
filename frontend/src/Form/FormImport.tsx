import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import { Stack } from '@mui/system'
import React, { Dispatch, SetStateAction, useState } from 'react'
import FileInput from 'src/common/FileInput'

import { useGetUiConfig } from '../../data/uiConfig'
import { SplitSchema } from '../../types/interfaces'
import { getStepsData, setStepsData } from '../../utils/formUtils'


export default function FormImport({
  onSubmit,
}: {
  onSubmit: any
}) {
  const [validationErrorText, setValidationErrorText] = useState<string>('')
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [warningCheckboxVal, setWarningCheckboxVal] = useState<boolean>(false)
  const [uploadModel, setUploadModel] = useState<any>()

  const handleCheckboxChange = (e) => {
    setWarningCheckboxVal(e.target.checked)
  }

  const handleModelChange = (e) => {
        console.log(e.target.files[0])
        setUploadModel(e.target.files[0])
  }

  const uploadModelToAPI = () => {
    if (uploadModel && uploadModel.name.endsWith('.zip')) {
        // Axios request to backend importModel endpoint
        console.log(`Submit button pressed. File ${uploadModel.name} - sent to API`)
    } else { 
        console.log('Ensure you select a .zip file using Select Model');
    }
  }

  if (isUiConfigError || isUiConfigLoading) {
    return null
  }

  return (
    <>
     
          <Box key={'import'}>
            <Button>
                <Stack direction='row' spacing={2} alignItems='center'>
                    <FileInput label='Select Model' file={uploadModel} onChange={(event) => handleModelChange(event)} accepts='.zip' />
                 </Stack>
            </Button>
          </Box>

      {uiConfig?.uploadWarning?.showWarning && (
        <Alert sx={{ width: '100%', mt: 3 }} severity={warningCheckboxVal ? 'success' : 'warning'}>
          <Checkbox
            size='small'
            checked={warningCheckboxVal}
            onChange={handleCheckboxChange}
            sx={{ p: 0, mr: 1 }}
            data-test='warningCheckbox'
          />
          {uiConfig.uploadWarning.checkboxText}
        </Alert>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button
          variant='contained'
          onClick={uploadModelToAPI}
          sx={{ mt: 3 }}
          data-test='submitButton'
          disabled={uiConfig?.uploadWarning.showWarning && !warningCheckboxVal}
        >
          Submit
        </Button>
      </Box>
    </>
  )
}
