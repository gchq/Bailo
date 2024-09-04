import { Done, Warning } from '@mui/icons-material'
import { Chip, Grid, Link, Stack, Tooltip, Typography } from '@mui/material'
import prettyBytes from 'pretty-bytes'
import { FileInterface, isFileInterface, ScanState } from 'types/types'

type FileDownloadProps = {
  modelId: string
  file: FileInterface | File
}

export default function FileDownload({ modelId, file }: FileDownloadProps) {
  const avChip = (fileScan: FileInterface['avScan']) => {
    if (fileScan.state !== ScanState.Complete) {
      return <Chip size='small' label='Virus scan in progress' />
    }
    if (fileScan.viruses && fileScan.viruses.length > 0) {
      return (
        <Chip
          color={'error'}
          icon={<Warning />}
          size='small'
          label={`Virus scan failed: ${fileScan.viruses.length} threats found`}
        />
      )
    }
    return <Chip color={'success'} icon={<Done />} size='small' label={'Virus scan passed'} />
  }

  return (
    <>
      {isFileInterface(file) && (
        <>
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
                {avChip(file.avScan)}
              </Stack>
            </Grid>
            <Grid item xs={1} textAlign='right'>
              <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
            </Grid>
          </Grid>
        </>
      )}
    </>
  )
}
