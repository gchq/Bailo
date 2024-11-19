import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useState } from 'react'
import HelpPopover from 'src/common/HelpPopover'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, EntityKind } from 'types/types'

interface ManualEntryAccessProps {
  accessList: CollaboratorEntry[]
  setAccessList: (accessList: CollaboratorEntry[]) => void
}

export default function ManualEntryAccess({ accessList, setAccessList }: ManualEntryAccessProps) {
  const [manualEntityName, setManualEntityName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const handleAddEntityManuallyOnClick = async () => {
    setErrorMessage('')
    if (manualEntityName !== undefined && manualEntityName !== '') {
      if (accessList.find((collaborator) => collaborator.entity === `${EntityKind.USER}:${manualEntityName}`)) {
        return setErrorMessage(`The requested user has already been added below.`)
      }
      setAccessList([...accessList, { entity: `${EntityKind.USER}:${manualEntityName}`, roles: [] }])
      setManualEntityName('')
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
        <Typography sx={{ mr: 1 }} component='caption'>
          Trouble finding a user? Click here to add them manually
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {isUiConfigLoading && <Loading />}
        {!isUiConfigLoading && uiConfig && (
          <Box component='form' onSubmit={handleAddEntityManuallyOnClick}>
            <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} alignItems='center'>
              <TextField
                id='manual-entity-name-select'
                size='small'
                fullWidth
                label='User'
                value={manualEntityName}
                onChange={(e) => setManualEntityName(e.target.value)}
              />
              {uiConfig.helpPopoverText.manualEntryAccess && (
                <HelpPopover>{uiConfig.helpPopoverText.manualEntryAccess}</HelpPopover>
              )}
              <Button variant='contained' type='submit' disabled={manualEntityName === ''}>
                Add
              </Button>
            </Stack>
          </Box>
        )}
        <MessageAlert message={errorMessage} severity='error' />
      </AccordionDetails>
    </Accordion>
  )
}
