import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { LoadingButton } from '@mui/lab'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Stack,
  TextField,
  Tooltip,
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
  isReadOnly: boolean
  requiredRolesText: string
}

export default function ExportSettings({ model, isReadOnly, requiredRolesText }: ExportSettingsProps) {
  const sendNotification = useNotification()
  const [destinationModelId, setDestinationModelId] = useState(model.settings.mirror?.destinationModelId || '')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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
      <ExportModelAgreement modelId={model.id} isReadOnly={isReadOnly} requiredRolesText={requiredRolesText} />
      <Accordion sx={{ borderTop: 'none' }}>
        <AccordionSummary sx={{ pl: 0 }} expandIcon={<ExpandMoreIcon />}>
          <Typography component='h3' variant='h6'>
            Export Settings
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box component='form' onSubmit={handleSave}>
            <Stack spacing={2} alignItems='flex-start'>
              <LabelledInput label={'Destination Model ID'} htmlFor={'destination-model-id'} required>
                <Tooltip title={requiredRolesText}>
                  <span>
                    <TextField
                      id='destination-model-id'
                      value={destinationModelId}
                      disabled={isReadOnly}
                      onChange={handleDestinationModelId}
                      size='small'
                    />
                  </span>
                </Tooltip>
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
              <Tooltip title={requiredRolesText}>
                <span>
                  <LoadingButton
                    sx={{ width: 'fit-content' }}
                    variant='contained'
                    data-test='createAccessRequestButton'
                    loading={loading}
                    disabled={isReadOnly}
                    type='submit'
                  >
                    Save
                  </LoadingButton>
                </span>
              </Tooltip>
              <MessageAlert message={errorMessage} severity='error' />
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    </>
  )
}
