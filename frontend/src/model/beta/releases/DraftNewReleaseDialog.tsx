import { DesignServices } from '@mui/icons-material'
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { FormEvent, useState } from 'react'
import semver from 'semver'

import { postRelease } from '../../../../actions/release'
import { ReleaseInterface } from '../../../../types/types'
import { ModelInterface } from '../../../../types/v2/types'
import { getErrorMessage } from '../../../../utils/fetcher'
import MultiFileInput from '../../../common/MultiFileInput'
import MessageAlert from '../../../MessageAlert'

type DraftNewReleaseDialogProps = {
  open: boolean
  handleClose: () => void
  model: ModelInterface
}

export default function DraftNewReleaseDialog({ open, handleClose, model }: DraftNewReleaseDialogProps) {
  const [releaseName, setReleaseName] = useState('')
  const [semanticVersion, setSemanticVersion] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const [artefacts, setArtefacts] = useState<File[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isValidSemver(semanticVersion)) {
      const release: Partial<ReleaseInterface> = {
        modelId: model.id,
        name: releaseName,
        semver: semanticVersion,
        notes: releaseNotes,
        modelCardVersion: 1,
        minor: isMinorRelease,
        files: [],
        images: [],
      }

      const response = await postRelease(release, model.id)

      if (!response.ok) {
        const error = await getErrorMessage(response)
        return setErrorMessage(error)
      }

      handleClose()
    }
  }

  function handleMinorReleaseChecked() {
    setIsMinorRelease(!isMinorRelease)
  }

  function isValidSemver(semverInput: string) {
    return semver.valid(semverInput) ? true : false
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <Box component='form' onSubmit={onSubmit}>
        <DialogTitle color='primary'>Draft New Release</DialogTitle>
        <Box sx={{ mx: 3 }}>
          <Divider sx={{ margin: 'auto' }} />
        </Box>
        <DialogContent>
          <Stack spacing={2}>
            <DesignServices color='primary' fontSize='large' sx={{ margin: 'auto' }} />
            <DialogContentText>
              A release takes a snapshoot of the current state of the model code, artefacts and model card. Access
              requests will be able to select for any release of a model for deployment.
            </DialogContentText>

            <Stack spacing={2} direction={{ sm: 'row', xs: 'column' }}>
              <Stack sx={{ width: '100%' }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                  Release name <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField required size='small' value={releaseName} onChange={(e) => setReleaseName(e.target.value)} />
              </Stack>
              <Stack>
                <Typography sx={{ fontWeight: 'bold' }}>
                  Semantic version <span style={{ color: 'red' }}>*</span>
                </Typography>
                <TextField
                  required
                  size='small'
                  error={semanticVersion !== '' && !isValidSemver(semanticVersion)}
                  helperText={
                    semanticVersion !== '' && !isValidSemver(semanticVersion) ? 'Must follow format #.#.#' : ''
                  }
                  value={semanticVersion}
                  onChange={(e) => setSemanticVersion(e.target.value)}
                />
              </Stack>
            </Stack>
            <Stack>
              <Typography sx={{ fontWeight: 'bold' }}>
                Release notes <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                required
                size='small'
                multiline
                rows={4}
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
              />
            </Stack>
            <Stack direction='row'>
              <Checkbox sx={{ pl: 0 }} size='small' checked={isMinorRelease} onChange={handleMinorReleaseChecked} />
              <Typography>Minor release - No significant changes, does not require release re-approval</Typography>
            </Stack>
            <MultiFileInput fullWidth label='Attach artefacts' files={artefacts} setFiles={setArtefacts} />
          </Stack>
        </DialogContent>
        <Box sx={{ mx: 3 }}>
          <Divider sx={{ margin: 'auto' }} />
        </Box>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant='contained'
            type='submit'
            disabled={
              !semanticVersion || !artefacts || !releaseNotes || !releaseName || !isValidSemver(semanticVersion)
            }
          >
            Create Release
          </Button>
          <MessageAlert message={errorMessage} severity='error' />
        </DialogActions>
      </Box>
    </Dialog>
  )
}
