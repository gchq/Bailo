import { LoadingButton } from '@mui/lab'
import { Box, Button, Checkbox, FormControlLabel, Stack, Typography } from '@mui/material'
import { postModelExportToS3 } from 'actions/model'
import { ChangeEvent, FormEvent, useState } from 'react'
import Restricted from 'src/common/Restricted'
import ModelExportAgreementText from 'src/entry/model/mirroredModels/ModelExportAgreementText'
import useNotification from 'src/hooks/useNotification'
import MessageAlert from 'src/MessageAlert'
import { getErrorMessage } from 'utils/fetcher'

type ExportModelAgreementProps = {
  modelId: string
}

export default function ExportModelAgreement({ modelId }: ExportModelAgreementProps) {
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
    <>
      <Typography variant='h6' component='h1' color='primary'>
        Request a Model Export
      </Typography>
      <Box component='form' onSubmit={handleSubmit}>
        <Stack spacing={2} alignItems='start' justifyContent='start'>
          <ModelExportAgreementText />
          <FormControlLabel
            control={<Checkbox checked={checked} onChange={handleChecked} />}
            label='I agree to the terms and conditions of this model export agreement'
          />
          <Restricted action='exportMirroredModel' fallback={<Button disabled>Submit</Button>}>
            <LoadingButton variant='contained' loading={loading} disabled={!checked} type='submit'>
              Submit
            </LoadingButton>
          </Restricted>
          <MessageAlert message={errorMessage} severity='error' />
        </Stack>
      </Box>
    </>
  )
}
