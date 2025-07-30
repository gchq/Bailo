import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Button, Stack, TextField, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import HelpPopover from 'src/common/HelpPopover'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

interface ManualEntityInputProps {
  onAddEntityManually: (entityName: string) => void
  errorMessage: string
}

export default function ManualEntityInput({ onAddEntityManually, errorMessage }: ManualEntityInputProps) {
  const [manualEntityName, setManualEntityName] = useState('')

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const handleAddEntityManuallyOnClick = () => {
    if (manualEntityName !== undefined && manualEntityName !== '') {
      setManualEntityName('')
      onAddEntityManually(manualEntityName)
    }
  }

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <Accordion sx={{ borderTop: 'none' }}>
      <AccordionSummary
        sx={{ pl: 0, borderTop: 'none' }}
        expandIcon={<ExpandMoreIcon />}
        aria-controls='manual-user-add-content'
        id='manual-user-add-header'
      >
        <Typography sx={{ mr: 1 }} variant='caption'>
          Trouble finding a user? Click here to add them manually
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {isUiConfigLoading && <Loading />}
        {!isUiConfigLoading && uiConfig && (
          <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems='center'>
            <TextField
              size='small'
              fullWidth
              label='User'
              value={manualEntityName}
              onChange={(e) => setManualEntityName(e.target.value)}
            />
            {uiConfig.helpPopoverText.manualEntryAccess && (
              <HelpPopover>{uiConfig.helpPopoverText.manualEntryAccess}</HelpPopover>
            )}
            <Button variant='contained' disabled={manualEntityName === ''} onClick={handleAddEntityManuallyOnClick}>
              Add
            </Button>
          </Stack>
        )}
        <MessageAlert message={errorMessage} severity='error' />
      </AccordionDetails>
    </Accordion>
  )
}
