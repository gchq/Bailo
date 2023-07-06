import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import TextField from '@mui/material/TextField'
import React, { Dispatch, SetStateAction, useState } from 'react'

import { useGetUiConfig } from '../../data/uiConfig'
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
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()
  const [warningCheckboxVal, setWarningCheckboxVal] = useState<boolean>(false)

  const handleCheckboxChange = (e) => {
    setWarningCheckboxVal(e.target.checked)
  }

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

  if (isUiConfigError || isUiConfigLoading) {
    return null
  }

  return (
    <>
      {dataSteps.map((step) => {
        if (!step.renderBasic) {
          return null
        }

        const RenderBasic = step.renderBasic
        return (
          <Box key={step.section}>
            <RenderBasic step={step} splitSchema={splitSchema} setSplitSchema={setSplitSchema} />
          </Box>
        )
      })}
      <TextField
        fullWidth
        multiline
        maxRows={20}
        minRows={4}
        label='Metadata'
        value={metadata}
        onChange={handleMetadataChange}
        error={validationErrorText !== ''}
        helperText={validationErrorText}
        inputProps={{
          'data-test': 'metadataTextarea',
        }}
      />
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
          onClick={onSubmit}
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
