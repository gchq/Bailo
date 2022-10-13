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
  const { binary, code } = state

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

  return (
    <Grid container justifyContent='center'>
      {buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.Zip && (
        <Stack direction='row' spacing={2} sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ p: 1 }} variant='h5'>
              Upload a code file (.zip)
            </Typography>
            <FileInput label='Select Code' onChange={handleCodeChange} file={code} accepts='.zip' />
          </Box>
          <Divider orientation='vertical' flexItem />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ p: 1 }} variant='h5'>
              Upload a binary file (.zip)
            </Typography>
            <FileInput label='Select Binary' onChange={handleBinaryChange} file={binary} accepts='.zip' />
          </Box>
        </Stack>
      )}
      {buildOptionsStep !== undefined && buildOptionsStep.state.uploadType === ModelUploadType.ModelCard && (
        <Typography sx={{ p: 2 }}>Uploading a model card without any code or binary files</Typography>
      )}
    </Grid>
  )
}

export function fileTabComplete(step: Step) {
  const buildOptionsStep = step.state.steps.find(
    (buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions'
  )
  const hasUploadType = !!buildOptionsStep.state.uploadType
  if (!hasUploadType) {
    return true
  }
  return (
    (buildOptionsStep !== undefined &&
      buildOptionsStep.state.uploadType === ModelUploadType.Zip &&
      step.state.binary &&
      step.state.code) ||
    buildOptionsStep.state.uploadType === ModelUploadType.ModelCard
  )
}

export function RenderBasicFileTab({ step, splitSchema, setSplitSchema }: RenderInterface) {
  const { state } = step
  const { binary, code } = state

  const buildOptionsStep = useMemo(
    () => step.state.steps.find((buildOptionSchemaStep) => buildOptionSchemaStep.section === 'buildOptions'),
    [step]
  )

  const handleCodeChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setStepState(splitSchema, setSplitSchema, step, { ...state, code: event.target.files[0] })
  }

  const handleBinaryChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) setStepState(splitSchema, setSplitSchema, step, { ...state, binary: event.target.files[0] })
  }

  const hasUploadType = useMemo(() => !!buildOptionsStep.state.uploadType, [buildOptionsStep])

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
    </Box>
  )
}
