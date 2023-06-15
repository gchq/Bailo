import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Stack from '@mui/material/Stack'
import { useRouter } from 'next/router'
import { ReactElement } from 'react'
import { VersionUploadType } from 'types/types'

type Props = {
  open: boolean
  modelUuid: string
  versionNumber: string
  versionTag: string
  onClose: () => void
}

export default function NewVersionDialog({ open, modelUuid, versionNumber, versionTag, onClose }: Props): ReactElement {
  const router = useRouter()

  const getNewVersionPath = (uploadType: VersionUploadType): string =>
    `/model/${modelUuid}/new-version?versionNumber=${versionNumber}&versionTag=${versionTag}&uploadType=${uploadType}`

  const handleVersionUpdate = (): void => {
    router.push(getNewVersionPath(VersionUploadType.UPDATE))
  }

  const handleSibling = (): void => {
    router.push(getNewVersionPath(VersionUploadType.SIBLING))
  }

  // const handleVersionUpdateAndSibling = (): void => {
  //   router.push(getNewVersionPath(VersionUploadType.UPDATE_AND_SIBLING))
  // }

  const handleChild = (): void => {
    router.push(getNewVersionPath(VersionUploadType.CHILD))
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <Stack spacing={1}>
          <Stack direction='column' spacing={2}>
            <Button variant='contained' onClick={handleVersionUpdate}>
              Version Update
            </Button>
            <Button variant='contained' onClick={handleSibling}>
              Sibling
            </Button>
            {/* <Button variant='contained' onClick={handleVersionUpdateAndSibling}>
              Version Update + Sibling
            </Button> */}
            <Button variant='contained' onClick={handleChild}>
              Child
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
