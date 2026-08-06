import { Box, Button, Checkbox, Divider, FormControlLabel, Stack, Typography } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { postEntryExportToS3 } from 'actions/entry'
import { ChangeEvent, useContext, useState } from 'react'
import MarkdownDisplay from 'src/common/MarkdownDisplay'
import Restricted from 'src/common/Restricted'
import UiConfigContext from 'src/contexts/uiConfigContext'
import ReleaseSelector from 'src/entry/model/mirroredModels/ReleaseSelector'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, ReleaseInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type ExportModelAgreementProps = {
  model: EntryInterface
}

export default function ExportModelAgreement({ model }: ExportModelAgreementProps) {
  const uiConfig = useContext(UiConfigContext)
  const [checked, setChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedReleases, setSelectedReleases] = useState<ReleaseInterface[]>([])

  const sendNotification = useNotification()
  const theme = useTheme()

  const handleSubmit = async () => {
    setErrorMessage('')
    setLoading(true)

    const response = await postEntryExportToS3(model.id, {
      disclaimerAgreement: checked,
      semvers: selectedReleases.map((release) => release.semver),
    })
    setLoading(false)

    if (!response.ok) {
      return setErrorMessage(await getErrorMessage(response))
    } else {
      sendNotification({
        variant: 'success',
        msg: 'Successfully started export upload.',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }

  const handleChecked = (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

  const handleUpdateSelectedReleases = (releases: ReleaseInterface[]) => {
    setSelectedReleases(releases)
  }

  return (
    <>
      <Typography variant='h6' component='h1' color='primary'>
        Request a model export
      </Typography>
      <Box component='form' onSubmit={handleSubmit}>
        <Stack
          spacing={2}
          sx={{
            alignItems: 'start',
            justifyContent: 'start',
          }}
        >
          <Stack
            spacing={2}
            sx={{ borderStyle: 'solid', borderWidth: 1, borderColor: theme.palette.divider, p: 2, maxWidth: '730px' }}
          >
            <MarkdownDisplay>{uiConfig.modelMirror.export.disclaimer}</MarkdownDisplay>
            <FormControlLabel
              control={<Checkbox checked={checked} onChange={handleChecked} />}
              label='I agree to the terms and conditions of this model export agreement'
            />
            <Divider />
            <ReleaseSelector
              model={model}
              selectedReleases={selectedReleases}
              onUpdateSelectedReleases={handleUpdateSelectedReleases}
              isReadOnly={!checked}
            />
          </Stack>
          <Restricted action='exportMirroredModel' fallback={<Button disabled>Submit</Button>}>
            <Button variant='contained' loading={loading} disabled={!checked} onClick={handleSubmit}>
              Submit
            </Button>
          </Restricted>
          <MessageAlert message={errorMessage} severity='error' />
        </Stack>
      </Box>
    </>
  )
}
