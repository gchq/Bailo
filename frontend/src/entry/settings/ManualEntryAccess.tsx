import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { Accordion, AccordionDetails, AccordionSummary, Button, Stack, TextField, Typography } from '@mui/material'
import { getUserInformation } from 'actions/user'
import { useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import { CollaboratorEntry, EntityKind } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface ManualEntryAccessProps {
  accessList: CollaboratorEntry[]
  setAccessList: (accessList: CollaboratorEntry[]) => void
}

export default function ManualEntryAccess({ accessList, setAccessList }: ManualEntryAccessProps) {
  const [manualEntityName, setManualEntityName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleAddEntityManuallyOnClick = async () => {
    setErrorMessage('')
    if (manualEntityName !== undefined && manualEntityName !== '') {
      if (accessList.find((collaborator) => collaborator.entity === `${EntityKind.USER}:${manualEntityName}`)) {
        return setErrorMessage(`The requested user has already been added below.`)
      }
      const response = await getUserInformation(manualEntityName)
      if (!response.ok) {
        return setErrorMessage(await getErrorMessage(response))
      }
      const updatedAccessList = [...accessList]
      const newAccess = { entity: `${EntityKind.USER}:${manualEntityName}`, roles: [] }
      updatedAccessList.push(newAccess)
      setAccessList(updatedAccessList)
      setManualEntityName('')
    }
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
        <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }}>
          <TextField
            id='manual-entity-name-select'
            placeholder='Joe Bloggs'
            size='small'
            fullWidth
            label='User'
            value={manualEntityName}
            onChange={(e) => setManualEntityName(e.target.value)}
          />
          <Button variant='contained' onClick={handleAddEntityManuallyOnClick} disabled={manualEntityName === ''}>
            Add
          </Button>
        </Stack>
        <MessageAlert message={errorMessage} severity='error' />
      </AccordionDetails>
    </Accordion>
  )
}
