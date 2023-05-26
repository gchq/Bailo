import ReplayIcon from '@mui/icons-material/Replay'
import { Alert, Box, Button, CircularProgress, Grid } from '@mui/material'
import { postEndpoint } from 'data/api'
import { useGetModelVersion } from 'data/model'
import { useCallback, useEffect } from 'react'
import DisabledElementTooltip from 'src/common/DisabledElementTooltip'
import useNotification from 'src/common/Snackbar'
import TerminalLog from 'src/TerminalLog'
import { Version } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

interface Props {
  version: Version
}

export default function Build({ version }: Props) {
  const sendNotification = useNotification()

  if (!('uuid' in version.model)) {
    throw new Error('Build requires a version with a populated model field.')
  }

  const {
    version: versionLogs,
    mutateVersion,
    isVersionLoading,
    isVersionError,
  } = useGetModelVersion(version.model.uuid, version.version, true)

  const onRebuildModelClick = useCallback(async () => {
    const response = await postEndpoint(`/api/v1/version/${version?._id}/rebuild`, {})

    if (response.ok) {
      sendNotification({ variant: 'success', msg: 'Requested model rebuild' })
      mutateVersion()
    } else {
      sendNotification({ variant: 'error', msg: await getErrorMessage(response) })
    }
  }, [sendNotification, version, mutateVersion])

  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        mutateVersion()
      }
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [mutateVersion])

  if (isVersionLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (isVersionError || !versionLogs) {
    return <Alert severity='error'>Failed to load build logs...</Alert>
  }

  return (
    <>
      {version.state?.build?.state === 'failed' && (
        <Alert sx={{ mb: 3 }} severity='error'>
          Build Status: Failed
        </Alert>
      )}
      {version.state?.build?.state === 'retrying' && (
        <Alert sx={{ mb: 3 }} severity='warning'>
          Build Status: Retrying
        </Alert>
      )}
      <Grid container justifyContent='flex-end' sx={{ pb: 2 }}>
        <DisabledElementTooltip
          conditions={[version.state?.build?.state === 'retrying' ? 'Model is already retrying' : '']}
        >
          <Button
            disabled={version.state?.build?.state === 'retrying'}
            onClick={onRebuildModelClick}
            variant='outlined'
            startIcon={<ReplayIcon />}
          >
            Rebuild Model
          </Button>
        </DisabledElementTooltip>
      </Grid>
      <TerminalLog logs={versionLogs.logs} title='Model Build Logs' />
    </>
  )
}
