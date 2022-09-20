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

export default function RenderFileTab({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { binary, code } = state

  const codeId = 'select-code-file'
  const binaryId = 'select-binary-file'

  const Input = styled('input')({
    display: 'none',
  })

  const buildOptionsStep: Step = splitSchema.steps.filter(
    (buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions'
  )[0]

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
    <Grid container justifyContent='center'>
      {buildOptionsStep.state.uploadType === ModelUploadType.Zip && (
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
              <Input style={{ margin: '10px' }} id={binaryId} type='file' onChange={handleBinaryChange} accept='.zip' />
              <Button variant='outlined' component='span'>
                {binary ? displayFilename(binary.name) : 'Upload file'}
              </Button>
            </label>
          </Box>
        </Stack>
      )}
      {buildOptionsStep.state.uploadType === ModelUploadType.ModelCard && (
        <Typography sx={{ p: 2 }}>Uploading a model card without any code or binary files</Typography>
      )}
    </Grid>
  )
}

export function FileTabComplete(step: Step) {
  
  const buildOptionsStep: Step = step.state.steps.filter(
    (buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions'
  )[0]
  if (buildOptionsStep.state.uploadType === undefined) {
    return true
  }
  return (
    (buildOptionsStep.state.uploadType === ModelUploadType.Zip && step.state.binary && step.state.code) ||
    buildOptionsStep.state.uploadType === ModelUploadType.ModelCard
  )
}

export function RenderBasicFileTab({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { binary, code } = state

  const buildOptionsStep: Step = splitSchema.steps.filter(
    (buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions'
  )[0]

  const handleCodeChange = (e: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, code: e.target.files[0] })
  }

  const handleBinaryChange = (e: any) => {
    setStepState(splitSchema, setSplitSchema, step, { ...state, binary: e.target.files[0] })
  }

  return (
    <Box sx={{ pb: 4, pt: 4 }}>
      {(buildOptionsStep.state.uploadType === undefined ||
        buildOptionsStep.state.uploadType === ModelUploadType.Zip) && (
        <Stack direction='row' spacing={2} alignItems='center'>
          <FileInput label='Select Code' file={code} onChange={handleCodeChange} accepts='.zip' />
          <FileInput label='Select Binary' file={binary} onChange={handleBinaryChange} accepts='.zip' />
        </Stack>
      )}
      {buildOptionsStep.state.uploadType !== undefined &&
        buildOptionsStep.state.uploadType === ModelUploadType.ModelCard && (
          <Typography sx={{ pt: 2, pb: 2 }}>Uploading a model card without any code or binary files</Typography>
        )}
    </Box>
  )
}

export function BasicFileTabComplete(step: Step) {
  const buildOptionsStep: Step = step.state.steps.filter(
    (buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions'
  )[0]
  return (
    (buildOptionsStep.state.uploadType === ModelUploadType.Zip && step.state.binary && step.state.code) ||
    buildOptionsStep.state.uploadType === ModelUploadType.ModelCard
  )
}
