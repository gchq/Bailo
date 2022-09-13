import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/system'
import React from 'react'
import { RenderInterface, Step, ModelUploadType } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'
import FileInput from '../common/FileInput'

function RenderUploadType({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { uploadType } = state

  const handleUploadTypeChange = (event) => {
    state.code = undefined
    state.binary = undefined
    setStepState(splitSchema, setSplitSchema, step, { ...state, uploadType: event.target.value })
  }

  return (
    <FormControl>
      <InputLabel id='demo-simple-select-label'>Upload Type</InputLabel>
      <Select
        labelId='demo-simple-select-label'
        id='demo-simple-select'
        value={uploadType}
        label='Upload Type'
        onChange={handleUploadTypeChange}
        sx={{ maxWidth: 400 }}
      >
        <MenuItem value={ModelUploadType.Zip}>{ModelUploadType.Zip}</MenuItem>
        <MenuItem value={ModelUploadType.ModelCard}>{ModelUploadType.ModelCard}</MenuItem>
        <MenuItem disabled value={ModelUploadType.Docker}>
          {ModelUploadType.Docker}
        </MenuItem>
      </Select>
    </FormControl>
  )
}

export default function RenderFileTab({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { binary, code } = state

  const codeId = 'select-code-file'
  const binaryId = 'select-binary-file'

  const Input = styled('input')({
    display: 'none',
  })

  const handleCodeChange = (e: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, code: e.target.files[0] })
  }

  const handleBinaryChange = (e: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, binary: e.target.files[0] })
  }

  const displayFilename = (filename: string) => {
    const parts = filename.split('.')
    const ext = parts.pop()
    const base = parts.join('.')
    return base.length > 12 ? `${base}...${ext}` : filename
  }

  return (
    <>
      <Box sx={{ textAlign: 'center', mb: 3 }}>
        <RenderUploadType step={step} splitSchema={splitSchema} setSplitSchema={setSplitSchema} />
      </Box>
      <Grid container justifyContent='center'>
        {state.uploadType === ModelUploadType.Zip && (
          <Stack direction='row' spacing={2} sx={{ p: 3 }}>
            <Box sx={{ textAlign: 'center' }}>
              <label htmlFor={codeId}>
                <Typography sx={{ p: 1 }} variant='h5'>
                  Upload a code file (.zip)
                </Typography>
                <Input style={{ margin: '10px' }} id={codeId} type='file' onChange={handleCodeChange} accept='.zip' />
                <Button variant='outlined' component='span'>
                  {code ? displayFilename(code.name) : 'Upload file'}
                </Button>
              </label>
            </Box>
            <Divider orientation='vertical' flexItem />
            <Box sx={{ textAlign: 'center' }}>
              <label htmlFor={binaryId}>
                <Typography sx={{ p: 1 }} variant='h5'>
                  Upload a binary file (.zip)
                </Typography>
                <Input
                  style={{ margin: '10px' }}
                  id={binaryId}
                  type='file'
                  onChange={handleBinaryChange}
                  accept='.zip'
                />
                <Button variant='outlined' component='span'>
                  {binary ? displayFilename(binary.name) : 'Upload file'}
                </Button>
              </label>
            </Box>
          </Stack>
        )}
        {state.uploadType === ModelUploadType.ModelCard && (
          <Typography sx={{ p: 2 }}>Uploading a model card without any code or binary files</Typography>
        )}
      </Grid>
    </>
  )
}

export function FileTabComplete(step: Step) {
  return (
    (step.state.uploadType === ModelUploadType.Zip && step.state.binary && step.state.code) ||
    step.state.uploadType === ModelUploadType.ModelCard
  )
}

export function RenderBasicFileTab({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { binary, code } = state

  const handleCodeChange = (e: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, code: e.target.files[0] })
  }

  const handleBinaryChange = (e: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, binary: e.target.files[0] })
  }

  return (
    <Box sx={{ pb: 4, pt: 4 }}>
      <Box sx={{ pb: 4 }}>
        <RenderUploadType step={step} splitSchema={splitSchema} setSplitSchema={setSplitSchema} />
      </Box>
      {state.uploadType === ModelUploadType.Zip && (
        <Stack direction='row' spacing={2} alignItems='center'>
          <FileInput label='Select Code' file={code} onChange={handleCodeChange} accepts='.zip' />
          <FileInput label='Select Binary' file={binary} onChange={handleBinaryChange} accepts='.zip' />
        </Stack>
      )}
      {state.uploadType === ModelUploadType.ModelCard && (
        <Typography>Uploading a model card without any code or binary files</Typography>
      )}
    </Box>
  )
}

export function BasicFileTabComplete(step: Step) {
  return step.state.binary && step.state.code
}
