import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import React, { ChangeEvent, useMemo } from 'react'
import { RenderInterface, Step, ModelUploadType } from '../../types/interfaces'
import { setStepState } from '../../utils/formUtils'
import FileInput from '../common/FileInput'

export default function RenderFileTab({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { binary, code, docker } = state

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

  return (
    <Grid container justifyContent='center'>
      {buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.Zip && (
        <Stack direction='row' spacing={3} sx={{ p: 3 }} alignItems='center'>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant='h5'>Upload a code file (.zip)</Typography>
            <FileInput label='Select Code' onChange={handleCodeChange} file={code} accepts='.zip' />
          </Box>
          <Divider orientation='vertical' flexItem />
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant='h5'>Upload a binary file (.zip)</Typography>
            <FileInput label='Select Binary' onChange={handleBinaryChange} file={binary} accepts='.zip' />
          </Box>
        </Stack>
      )}
      {buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.ModelCard && (
        <Typography sx={{ p: 2 }}>Uploading a model card without any code or binary files</Typography>
      )}
      {buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.Docker && (
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ p: 1 }} variant='h5'>
            Upload a docker file (.tar)
          </Typography>
          <FileInput label='Select Docker Image' onChange={handleDockerChange} file={docker} accepts='.tar' />
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

  if (!step.steps) {
    return null
  }

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

  const hasUploadType = !!buildOptionsStep?.state?.uploadType

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
