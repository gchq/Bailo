import { Done, Warning } from '@mui/icons-material'
import { Chip, Grid, Link, Popover, Stack, Tooltip, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import prettyBytes from 'pretty-bytes'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, isFileInterface, ScanState } from 'types/types'
import { plural } from 'utils/stringUtils'

type FileDownloadProps = {
  modelId: string
  file: FileInterface | File
}

export default function FileDownload({ modelId, file }: FileDownloadProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const open = Boolean(anchorEl)

  const avChip = useMemo(() => {
    if (!isFileInterface(file) || file.avScan === undefined || file.avScan.state === ScanState.NotScanned) {
      return <Chip size='small' label='Virus scan results could not be found' />
    }
    if (file.avScan.state !== ScanState.Complete) {
      return <Chip size='small' label='Virus scan in progress' />
    }
    if (file.avScan.viruses && file.avScan.viruses.length > 0) {
      return (
        <>
          <Chip
            color={'error'}
            icon={<Warning />}
            size='small'
            onClick={(e) => setAnchorEl(e.currentTarget)}
            label={`Virus scan failed: ${plural(file.avScan.viruses.length, 'threat')} found`}
          />
          <Popover
            open={open}
            anchorEl={anchorEl}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
          >
            <Stack spacing={2} sx={{ p: 2 }}>
              <Typography fontWeight='bold'>
                The virus scan found the following {plural(file.avScan.viruses.length, 'threat')}
              </Typography>
              <ul>{file.avScan.viruses && file.avScan.viruses.map((virus) => <li key={virus}>{virus}</li>)}</ul>
            </Stack>
          </Popover>
        </>
      )
    }
    return <Chip color={'success'} icon={<Done />} size='small' label={'Virus scan passed'} />
  }, [anchorEl, file, open])

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (isUiConfigLoading) {
    return <Loading />
  }

  return (
    <>
      {isFileInterface(file) && (
        <Grid container alignItems='center' key={file.name}>
          <Grid item xs={11}>
            <Stack direction='row' alignItems='center' spacing={2}>
              <Tooltip title={file.name}>
                <Link href={`/api/v2/model/${modelId}/file/${file._id}/download`} data-test={`fileLink-${file.name}`}>
                  <Typography noWrap textOverflow='ellipsis'>
                    {file.name}
                  </Typography>
                </Link>
              </Tooltip>
              {uiConfig && uiConfig.avScanning && avChip}
            </Stack>
          </Grid>
          <Grid item xs={1} textAlign='right'>
            <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
          </Grid>
        </Grid>
      )}
    </>
  )
}
