import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import { Stack } from '@mui/system'
import axios from 'axios'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import FileInput from 'src/common/FileInput'
import LoadingBar from 'src/common/LoadingBar'

import { useGetUiConfig } from '../../data/uiConfig'

export default function FormImport({ setError }: { setError: (error: string) => void }) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [warningCheckboxVal, setWarningCheckboxVal] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<boolean>(true)
  const [uploadModel, setUploadModel] = useState<any>()
  const [modelUploading, setModelUploading] = useState<boolean>(false)
  const [loadingPercentage, setUploadPercentage] = useState<number>(0)

  const handleCheckboxChange = (e) => {
    setWarningCheckboxVal(e.target.checked)
  }

  const router = useRouter()

  const handleModelChange = (e) => {
    const uploadFile = e.target.files[0]
    console.log(uploadFile)
    if (uploadFile && uploadFile.type === 'application/zip') {
      setUploadModel(uploadFile)
      setError('')
      setUploadError(false)
    } else {
      setError('Ensure you select a .zip file using Select Model')
      setUploadModel(null)
      setUploadError(true)
    }
  }

  const uploadModelToAPI = async (e) => {
    e.preventDefault()
    const form = new FormData()
    form.append('model', uploadModel)
    if (uploadModel && uploadModel.type === 'application/zip') {
      setModelUploading(true)
      await axios({
        method: 'post',
        url: '/api/v1/import',
        headers: { 'Content-Type': 'multipart/form-data' },
        data: form,
        onUploadProgress: (progressEvent) => {
          setUploadPercentage(progressEvent.total ? (progressEvent.loaded * 100) / progressEvent.total : 0)
        },
      })
        .then(({data}) => {
            router.push(`/model/${data.model.uuid}`)
    })
        .catch((error) => {
            setError(error.response.data.message)
            setUploadModel(null)
            setUploadError(true)
            setWarningCheckboxVal(false)
            setModelUploading(false)
        })
      setUploadModel(null)
    } else {
      setError('Ensure you select a .zip file using Select Model')
      setUploadModel(null)
      setUploadError(true)
    }
  }

  if (isUiConfigError || isUiConfigLoading) {
    return null
  }

  return (
    <>
      <Box sx={{ py: 4 }} key={'import'}>
        <Button data-test='selectModel'>
          <Stack direction='row' spacing={2} alignItems='center'>
            <FileInput
              label='Select Model'
              file={uploadModel}
              onChange={(event) => handleModelChange(event)}
              accepts='.zip'
            />
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
          disabled={!warningCheckboxVal || uploadError}
        >
          Submit
        </Button>
      </Box>
      <LoadingBar showLoadingBar={modelUploading} loadingPercentage={loadingPercentage} />

    </>
  )
}