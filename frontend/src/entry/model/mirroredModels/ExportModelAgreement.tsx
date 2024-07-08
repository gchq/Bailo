import { LoadingButton } from '@mui/lab'
import { Box, Card, Checkbox, Container, FormControlLabel, Stack, Tooltip, Typography } from '@mui/material'
import { postModelExportToS3 } from 'actions/model'
import { ChangeEvent, FormEvent, useState } from 'react'
import ModelExportAgreementText from 'src/entry/model/mirroredModels/ModelExportAgreementText'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { getErrorMessage } from 'utils/fetcher'

type ExportModelProps = {
  modelId: string
  isReadOnly: boolean
  requiredRolesText: string
}

export default function ExportModel({ modelId, isReadOnly, requiredRolesText }: ExportModelProps) {
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
      } else {
        setLoading(false)
        sendNotification({
          variant: 'success',
          msg: 'Successfully started export upload.',
          anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
        })
      }
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
            <ModelExportAgreementText />
            <Tooltip title={requiredRolesText}>
              <FormControlLabel
                control={<Checkbox checked={checked} disabled={isReadOnly} onChange={handleChecked} />}
                label='I agree to the terms and conditions of this model export agreement'
              />
            </Tooltip>
            <Tooltip title={requiredRolesText}>
              <span>
                <LoadingButton variant='contained' loading={loading} disabled={!checked} type='submit'>
                  Submit
                </LoadingButton>
              </span>
            </Tooltip>
            <MessageAlert message={errorMessage} severity='error' />
          </Stack>
        </Box>
      </Card>
    </Container>
  )
}
