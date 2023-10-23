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
import HelpPopover from '../../../common/HelpPopover'
import MultiFileInput from '../../../common/MultiFileInput'
import RichTextEditor from '../../../common/RichTextEditor'
import MessageAlert from '../../../MessageAlert'

type DraftNewReleaseDialogProps = {
  open: boolean
  handleClose: () => void
  model: ModelInterface
  mutateReleases: () => void
}

export default function DraftNewReleaseDialog({
  open,
  handleClose,
  model,
  mutateReleases,
}: DraftNewReleaseDialogProps) {
  const [semanticVersion, setSemanticVersion] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const [artefacts, setArtefacts] = useState<File[]>([])
  const [errorMessage, setErrorMessage] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    if (!model.card.version) {
      return setErrorMessage('Please make sure your model has a schema set before drafting a release.')
    }
    if (isValidSemver(semanticVersion)) {
      const release: Partial<ReleaseInterface> = {
        modelId: model.id,
        semver: semanticVersion,
        modelCardVersion: model.card.version,
        notes: releaseNotes,
        minor: isMinorRelease,
        files: [],
        images: [],
      }

      const response = await postRelease(release, model.id)

      if (!response.ok) {
        const error = await getErrorMessage(response)
        return setErrorMessage(error)
      }

      clearFormData()
      handleClose()
      mutateReleases()
    }
  }

  function handleCancel() {
    clearFormData()
    handleClose()
  }

  function clearFormData() {
    setSemanticVersion('')
    setReleaseNotes('')
    setIsMinorRelease(false)
    setArtefacts([])
    setErrorMessage('')
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
            <Stack sx={{ width: '100%' }} justifyContent='center'>
              <Stack direction='row'>
                <Typography sx={{ fontWeight: 'bold' }}>Release name</Typography>
                <HelpPopover>
                  The release name is automatically generated using the model name and release semantic version
                </HelpPopover>
              </Stack>
              <Typography>{`${model.name} - ${semanticVersion}`}</Typography>
            </Stack>
            <Stack>
              <Typography sx={{ fontWeight: 'bold' }}>
                Semantic version <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                required
                size='small'
                error={semanticVersion !== '' && !isValidSemver(semanticVersion)}
                helperText={semanticVersion !== '' && !isValidSemver(semanticVersion) ? 'Must follow format #.#.#' : ''}
                value={semanticVersion}
                onChange={(e) => setSemanticVersion(e.target.value)}
              />
            </Stack>
            <Stack>
              <RichTextEditor
                value={releaseNotes}
                onChange={(value) => setReleaseNotes(value)}
                aria-label='Release notes'
                label={
                  <Typography component='label' sx={{ fontWeight: 'bold' }} htmlFor={'new-model-description'}>
                    Release Notes <span style={{ color: 'red' }}>*</span>
                  </Typography>
                }
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
          <Button onClick={handleCancel}>Cancel</Button>
          <Button
            variant='contained'
            type='submit'
            disabled={!semanticVersion || !artefacts || !releaseNotes || !isValidSemver(semanticVersion)}
          >
            Create Release
          </Button>
        </DialogActions>
        <Box sx={{ px: 2 }}>
          <MessageAlert message={errorMessage} severity='error' />
        </Box>
      </Box>
    </Dialog>
  )
}
