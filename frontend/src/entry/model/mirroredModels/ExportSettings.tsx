import { Save } from '@mui/icons-material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { patchEntry } from 'actions/entry'
import { ChangeEvent, FormEvent, useState } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import ExportModelAgreement from 'src/entry/model/mirroredModels/ExportModelAgreement'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type ExportSettingsProps = {
  model: EntryInterface
}

export default function ExportSettings({ model }: ExportSettingsProps) {
  const sendNotification = useNotification()
  const [destinationModelId, setDestinationModelId] = useState(model.settings.mirror?.destinationModelId || '')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(destinationModelId === undefined || destinationModelId === '')

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    setLoading(true)
    event.preventDefault()

    const updatedSettings = {
      settings: {
        mirror: {
          destinationModelId: destinationModelId,
        },
      },
    }
    const response = await patchEntry(model.id, updatedSettings)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Model export settings updated',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }

    setLoading(false)
  }

  const handleDestinationModelId = (event: ChangeEvent<HTMLInputElement>) => {
    setDestinationModelId(event.target.value)
  }

  return (
    <>
      <Container maxWidth='md'>
        <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
          <Box component='form' onSubmit={handleSave}>
            <Stack spacing={3} divider={<Divider flexItem />}>
              <Accordion
                expanded={isSettingsOpen}
                onChange={() => setIsSettingsOpen(isSettingsOpen ? false : true)}
                slotProps={{ heading: { component: 'h3' } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                  <Typography sx={{ width: '100%' }} color='primary' variant='h6' component='div'>
                    Model export settings
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Stack spacing={2}>
                    <LabelledInput label={'Destination Model ID'} htmlFor={'destination-model-id'} required>
                      <TextField
                        id='destination-model-id'
                        value={destinationModelId}
                        onChange={handleDestinationModelId}
                        size='small'
                      />
                    </LabelledInput>
                    <Button
                      sx={{ width: 'fit-content' }}
                      variant='contained'
                      data-test='createAccessRequestButton'
                      loading={loading}
                      type='submit'
                      startIcon={<Save />}
                    >
                      Save
                    </Button>
                    <MessageAlert message={errorMessage} severity='error' />
                  </Stack>
                </AccordionDetails>
              </Accordion>
              <ExportModelAgreement model={model} />
            </Stack>
          </Box>
        </Card>
      </Container>
    </>
  )
}
