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
import { ChangeEvent, useState } from 'react'
import semver from 'semver'
import FileInput from 'src/common/FileInput'

export default function DraftNewReleaseDialog({ open, handleClose }: { open: boolean; handleClose: () => void }) {
  const [releaseName, setReleaseName] = useState('')
  const [semanticVersion, setSemanticVersion] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const [artefact, setArtefact] = useState<any>(undefined)

  function onSubmit(event) {
    event.preventDefault()
    if (validSemver(semanticVersion)) {
      console.log('Release valid and created!')
      handleClose()
    }
  }

  function handleMinorReleaseChecked() {
    setIsMinorRelease(!isMinorRelease)
  }

  function handleArtefactChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) setArtefact(event.target.files[0])
  }

  function validSemver(semverInput: string) {
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
                  error={semanticVersion !== '' && !validSemver(semanticVersion)}
                  helperText={semanticVersion !== '' && !validSemver(semanticVersion) ? 'Must follow format #.#.#' : ''}
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
            <FileInput
              label='Attach artefacts by dropping them here or upload a Docker image'
              file={artefact}
              onChange={handleArtefactChange}
              accepts='.zip'
            />
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
            disabled={!semanticVersion || !artefact || !releaseNotes || !releaseName || !validSemver(semanticVersion)}
          >
            Create Release
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
