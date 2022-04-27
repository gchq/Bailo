import { Dispatch, SetStateAction, useState } from 'react'

import TextField from '@mui/material/TextField'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'

import { SplitSchema } from '../../types/interfaces'
import { getStepsData, setStepsData } from '../../utils/formUtils'

export default function FormUpload({
  splitSchema,
  setSplitSchema,
  onSubmit,
}: {
  splitSchema: SplitSchema
  setSplitSchema: Dispatch<SetStateAction<SplitSchema>>
  onSubmit: any
}) {
  const dataSteps = splitSchema.steps.filter((step) => step.type === 'Data')
  const [metadata, setMetadata] = useState(JSON.stringify(getStepsData(splitSchema), null, 4))
  const [validationErrorText, setValidationErrorText] = useState<string>('')

  const handleMetadataChange = (event: any) => {
    setMetadata(event.target.value)

    try {
      setValidationErrorText('')
      const parsed = JSON.parse(event.target.value)

      if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
        setValidationErrorText('Invalid metadata')
        return
      }

      setStepsData(splitSchema, setSplitSchema, parsed)
    } catch (error) {
      setValidationErrorText('Invalid JSON')
    }
  }

  return (
    <>
      {dataSteps.map((step, index) => (
        <Box key={`${index}`}>{step.renderBasic(step, splitSchema, setSplitSchema)}</Box>
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
        data-test='metadataTextarea'
      />
      <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button variant='contained' onClick={onSubmit} sx={{ mt: 3 }} data-test='submitButton'>
          Submit
        </Button>
      </Box>
    </>
  )
}
