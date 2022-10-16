import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/system'
import React, { ChangeEvent, useMemo } from 'react'
import { RenderInterface, Step, ModelUploadType } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'
import FileInput from '../common/FileInput'

export default function RenderFileTab({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { binary, code, docker } = state

  const codeId = 'select-code-file'
  const binaryId = 'select-binary-file'
  const dockerId = 'select-docker-file'

  const Input = styled('input')({
    display: 'none',
  })

  const buildOptionsStep = useMemo(
    () => splitSchema.steps.find((buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions'),
    [splitSchema.steps]
  )

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setStepState(splitSchema, setSplitSchema, step, { ...state, code: event.target.files[0] })
  }

  const handleBinaryChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setStepState(splitSchema, setSplitSchema, step, { ...state, binary: event.target.files[0] })
  }

  const handleDockerChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setStepState(splitSchema, setSplitSchema, step, { ...state, docker: event.target.files[0] })
  }

  const displayFilename = (filename: string) => {
    const parts = filename.split('.')
    const ext = parts.pop()
    const base = parts.join('.')
    return base.length > 12 ? `${base}...${ext}` : filename
  }

  return (
    <Grid container justifyContent='center'>
      {buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.Zip && (
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
      {buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.ModelCard && (
        <Typography sx={{ p: 2 }}>Uploading a model card without any code or binary files</Typography>
      )}
      {buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.Docker && (
        <Box sx={{ textAlign: 'center' }}>
          <label htmlFor={dockerId}>
            <Typography sx={{ p: 1 }} variant='h5'>
              Upload a Docker file (.tar)
            </Typography>
            <Input style={{ margin: '10px' }} id={dockerId} type='file' onChange={handleDockerChange} accept='.tar' />
            <Button variant='outlined' component='span'>
              {docker ? displayFilename(docker.name) : 'Upload Docker'}
            </Button>
          </label>
        </Box>
      )}
    </Grid>
  )
}

export function fileTabComplete(step: Step) {
  if (!step.steps) return false

  const buildOptionsStep = step.steps.find((buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions')

  const hasUploadType = !!buildOptionsStep?.state?.uploadType

  if (!hasUploadType) {
    return false
  }

  switch (buildOptionsStep.state.uploadType) {
    case ModelUploadType.ModelCard:
      return true
    case ModelUploadType.Zip:
      return step.state.binary && step.state.code
    case ModelUploadType.Docker:
      return !!step.state.docker
    default:
      return false
  }
}

export function RenderBasicFileTab({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { binary, code, docker } = state

  const buildOptionsStep = step.steps.find((buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions')

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setStepState(splitSchema, setSplitSchema, step, { ...state, code: event.target.files[0] })
  }

  const handleBinaryChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setStepState(splitSchema, setSplitSchema, step, { ...state, binary: event.target.files[0] })
  }

  const handleDockerChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setStepState(splitSchema, setSplitSchema, step, { ...state, docker: event.target.files[0] })
  }

  const hasUploadType = !!buildOptionsStep.state.uploadType

  return (
    <Box sx={{ py: 4 }}>
      {(!hasUploadType ||
        (buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.Zip)) && (
        <Stack direction='row' spacing={2} alignItems='center'>
          <FileInput label='Select Code' file={code} onChange={handleCodeChange} accepts='.zip' />
          <FileInput label='Select Binary' file={binary} onChange={handleBinaryChange} accepts='.zip' />
        </Stack>
      )}
      {hasUploadType && buildOptionsStep.state.uploadType === ModelUploadType.ModelCard && (
        <Typography sx={{ py: 2 }}>Uploading a model card without any code or binary files</Typography>
      )}
      {hasUploadType && buildOptionsStep.state.uploadType === ModelUploadType.Docker && (
        <FileInput label='Select Docker Tar' file={docker} onChange={handleDockerChange} accepts='.tar' />
      )}
    </Box>
  )
}
