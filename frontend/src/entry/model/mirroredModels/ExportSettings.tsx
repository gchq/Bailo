import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { LoadingButton } from '@mui/lab'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Container,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { patchModel } from 'actions/model'
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

  // TODO - Add the ability to filter releases needed for export (This functionality is not available on the backend)
  // const [selectedReleases, setSelectedReleases] = useState<ReleaseInterface[]>([])

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
    const response = await patchModel(model.id, updatedSettings)

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
              <Accordion expanded={isSettingsOpen} onChange={() => setIsSettingsOpen(isSettingsOpen ? false : true)}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 0 }}>
                  <Typography variant='h6' component='h1' color='primary' align='center'>
                    Model Export Settings
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
                    {/*TODO - Add the ability to filter releases needed for export (This functionality is not available on the backend)
              <ReleaseSelector
                model={model}
                selectedReleases={selectedReleases}
                onUpdateSelectedReleases={handleUpdateSelectedReleases}
                isReadOnly={isReadOnly}
                requiredRolesText={requiredRolesText}
              />
               */}
                    <LoadingButton
                      sx={{ width: 'fit-content' }}
                      variant='contained'
                      data-test='createAccessRequestButton'
                      loading={loading}
                      type='submit'
                    >
                      Save
                    </LoadingButton>
                    <MessageAlert message={errorMessage} severity='error' />
                  </Stack>
                </AccordionDetails>
              </Accordion>
              <ExportModelAgreement modelId={model.id} />
            </Stack>
          </Box>
        </Card>
      </Container>
    </>
  )
}
