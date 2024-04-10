import FileDownloadIcon from '@mui/icons-material/FileDownload'
import { LoadingButton } from '@mui/lab'
import { Grid, Typography } from '@mui/material'
import axios from 'axios'
import prettyBytes from 'pretty-bytes'
import useNotification from 'src/hooks/useNotification'
import { FileInterface, isFileInterface } from 'types/types'

type FileDownloadProps = {
  modelId: string
  file: FileInterface
}

export default function FileDownload({ modelId, file }: FileDownloadProps) {
  const sendNotification = useNotification()

  const handleFileDownload = async () => {
    await axios
      .get(`/api/v2/model/${modelId}/file/${file._id}/download`)
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', file.name)
        document.body.appendChild(link)
        link.click()
      })
      .catch(function (error) {
        if (error.response) {
          sendNotification({
            variant: 'error',
            msg: `Error code ${error.response.status} recieved from server whilst attemping to download file ${file.name}`,
          })
        } else if (error.request) {
          sendNotification({
            variant: 'error',
            msg: `There was a problem with the request whilst attemping to download file ${file.name}`,
          })
        } else {
          sendNotification({ variant: 'error', msg: `Unknown error whilst attemping to download file ${file.name}` })
        }
      })
  }
  return (
    <>
      {isFileInterface(file) && (
        <Grid container columns={20} key={file.name}>
          <Grid item xs={1}>
            <LoadingButton
              color='primary'
              sx={{ minWidth: 0, height: 25, width: 25 }}
              size='small'
              variant='contained'
              onClick={handleFileDownload}
            >
              <FileDownloadIcon fontSize='small' />
            </LoadingButton>
          </Grid>
          <Grid item xs={15}>
            <Typography noWrap textOverflow='ellipsis'>
              {file.name}
            </Typography>
          </Grid>
          <Grid item xs={4} textAlign='right'>
            <Typography variant='caption'>{prettyBytes(file.size)}</Typography>
          </Grid>
        </Grid>
      )}
    </>
  )
}
