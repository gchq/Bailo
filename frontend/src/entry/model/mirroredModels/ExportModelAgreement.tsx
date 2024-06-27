import { LoadingButton } from '@mui/lab'
import { Box, Card, Checkbox, Container, FormControlLabel, Stack, Typography } from '@mui/material'
import { postModelExportToS3 } from 'actions/model'
import { ChangeEvent, FormEvent, useState } from 'react'
import ModelExportAgreement from 'src/entry/model/mirroredModels/ModelExportAgreement'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { getErrorMessage } from 'utils/fetcher'

type ExportModelProps = {
  modelId: string
}

export default function ExportModel({ modelId }: ExportModelProps) {
  const [checked, setChecked] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const sendNotification = useNotification()

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    if (event) {
      setErrorMessage('')
      event.preventDefault()
      setLoading(true)
      const response = await postModelExportToS3(modelId, { disclaimerAgreement: checked })

      if (!response.ok) {
        setLoading(false)

        const error = await getErrorMessage(response)
        return setErrorMessage(error)
      }
      setLoading(false)
      sendNotification({
        variant: 'success',
        msg: 'Successfully started export upload.',
        anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      })
    }
  }

  const handleChecked = async (event: ChangeEvent<HTMLInputElement>) => {
    setChecked(event.target.checked)
  }

  return (
    <Container maxWidth='md'>
      <Card sx={{ mx: 'auto', my: 4, p: 4 }}>
        <Typography variant='h6' component='h1' color='primary' align='center'>
          Model Export Agreement
        </Typography>
        <Box component='form' onSubmit={handleSubmit}>
          <Stack spacing={2} alignItems='start' justifyContent='start'>
            <ModelExportAgreement />
            <FormControlLabel
              control={<Checkbox checked={checked} onChange={handleChecked} />}
              label='I agree to the terms and conditions of this model export agreement'
            />
            <LoadingButton variant='contained' loading={loading} disabled={!checked} type='submit'>
              Submit
            </LoadingButton>
            <MessageAlert message={errorMessage} severity='error' />
          </Stack>
        </Box>
      </Card>
    </Container>
  )
}
