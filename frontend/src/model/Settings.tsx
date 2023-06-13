import { Box, Button, Stack, Typography } from '@mui/material'
import copy from 'copy-to-clipboard'
import { deleteEndpoint } from 'data/api'
import { useRouter } from 'next/router'
import { useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import DisabledElementTooltip from 'src/common/DisabledElementTooltip'
import useNotification from 'src/common/Snackbar'
import { Version } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface Props {
  version: Version
  isPotentialUploader: boolean
}

export default function Settings({ version, isPotentialUploader }: Props) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteModelErrorMessage, setDeleteModelErrorMessage] = useState('')
  const sendNotification = useNotification()
  const router = useRouter()

  const copyModelCardToClipboard = () => {
    copy(JSON.stringify(version?.metadata, null, 2))
    sendNotification({ variant: 'success', msg: 'Copied model card to clipboard' })
  }

  const handleDelete = () => {
    setDeleteModelErrorMessage('')
    setDeleteConfirmOpen(true)
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
  }

  const handleDeleteConfirm = async () => {
    const response = await deleteEndpoint(`/api/v1/version/${version._id}`)

    if (response.ok) {
      router.push('/')
    } else {
      setDeleteModelErrorMessage(await getErrorMessage(response))
    }
  }

  return (
    <Box data-test='modelSettingsPage'>
      <Typography variant='h6' sx={{ mb: 1 }}>
        General
      </Typography>

      <Box mb={2}>
        <Button variant='outlined' onClick={copyModelCardToClipboard}>
          Copy model card to clipboard
        </Button>
      </Box>

      <Box sx={{ mb: 4 }} />
      <ConfirmationDialogue
        open={deleteConfirmOpen}
        title='Delete version'
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        errorMessage={deleteModelErrorMessage}
      />
      <Typography variant='h6' sx={{ mb: 1 }}>
        Danger Zone
      </Typography>
      <Stack direction='row' spacing={2}>
        <DisabledElementTooltip
          conditions={[!isPotentialUploader ? 'You do not have permission to delete this version' : '']}
          placement='bottom'
        >
          <Button
            variant='contained'
            disabled={!isPotentialUploader}
            color='error'
            onClick={handleDelete}
            data-test='deleteVersionButton'
          >
            Delete version
          </Button>
        </DisabledElementTooltip>
        <Button variant='contained' color='error' disabled data-test='deleteModelButton'>
          Delete model
        </Button>
      </Stack>
    </Box>
  )
}
