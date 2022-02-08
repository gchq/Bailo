import { useState } from 'react'

import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import { Step } from '../../types/interfaces'
import { getStepsData, setStepsData } from '../../utils/formUtils'

export default function FormUpload({
  steps,
  setSteps,
  onSubmit,
}: {
  steps: Array<Step>
  setSteps: Function
  onSubmit: any
}) {
  const dataSteps = steps.filter((step) => step.type === 'Data')
  const [metadata, setMetadata] = useState(JSON.stringify(getStepsData(steps), null, 4))
  const [validationErrorText, setValidationErrorText] = useState<string>('')

  const handleMetadataChange = (e: any) => {
    setMetadata(e.target.value)

    try {
      setValidationErrorText('')
      const parsed = JSON.parse(e.target.value)

      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        setValidationErrorText('Invalid metadata')
        return
      }

      setStepsData(steps, setSteps, parsed)
    } catch (e) {
      setValidationErrorText('Invalid JSON')
    }
  }

  return (
    <>
      {dataSteps.map((step, index) => (
        <Box key={`${index}`}>{step.renderBasic(step, steps, setSteps)}</Box>
      ))}
      <TextField
        fullWidth
        multiline
        rows={4}
        label='Metadata'
        value={metadata}
        onChange={handleMetadataChange}
        error={validationErrorText !== ''}
        helperText={validationErrorText}
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button variant='contained' onClick={onSubmit} sx={{ mt: 3 }} data-test='submitButton'>
          Submit
        </Button>
      </Box>
    </>
  )
}
