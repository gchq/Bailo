import { DesignServices } from '@mui/icons-material'
import { LoadingButton } from '@mui/lab'
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { useGetReleasesForModelId } from 'actions/release'
import { CreateReleaseParams, postFile, postRelease } from 'actions/release'
import { FormEvent, useState } from 'react'
import MessageAlert from 'src/MessageAlert'
import ReleaseForm from 'src/model/beta/releases/ReleaseForm'
import { FileWithMetadata, FlattenedModelImage } from 'types/interfaces'
import { ModelInterface } from 'types/v2/types'
import { getErrorMessage } from 'utils/fetcher'
import { isValidSemver } from 'utils/stringUtils'

type DraftNewReleaseDialogProps = {
  open: boolean
  model: ModelInterface
  onClose: () => void
}

export default function DraftNewReleaseDialog({ open, model, onClose }: DraftNewReleaseDialogProps) {
  const [semver, setSemver] = useState('')
  const [releaseNotes, setReleaseNotes] = useState('')
  const [isMinorRelease, setIsMinorRelease] = useState(false)
  const [artefacts, setArtefacts] = useState<File[]>([])
  const [artefactsMetadata, setArtefactsMetadata] = useState<FileWithMetadata[]>([])
  const [imageList, setImageList] = useState<FlattenedModelImage[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const { mutateReleases } = useGetReleasesForModelId(model.id)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')
    setLoading(true)
    if (!model.card.version) {
      setLoading(false)
      return setErrorMessage('Please make sure your model has a schema set before drafting a release.')
    }
    if (isValidSemver(semver)) {
      const fileIds: string[] = []
      for (const artefact of artefacts) {
        const artefactMetadata = artefactsMetadata.find((metadata) => metadata.fileName === artefact.name)
        const postArtefactResponse = await postFile(
          artefact,
          model.id,
          artefact.name,
          artefact.type,
          artefactMetadata?.metadata,
        )
        if (postArtefactResponse.ok) {
          const res = await postArtefactResponse.json()
          fileIds.push(res.file._id)
        } else {
          setLoading(false)
          return setErrorMessage(await getErrorMessage(postArtefactResponse))
        }
      }

      setLoading(false)

      const release: CreateReleaseParams = {
        modelId: model.id,
        semver,
        modelCardVersion: model.card.version,
        notes: releaseNotes,
        minor: isMinorRelease,
        fileIds: fileIds,
        images: imageList,
      }

      const response = await postRelease(release)

      if (!response.ok) {
        const error = await getErrorMessage(response)
        setLoading(false)
        return setErrorMessage(error)
      }

      clearFormData()
      setLoading(false)
      mutateReleases()
      onClose()
    }
  }

  const handleCancel = () => {
    clearFormData()
    setLoading(false)
    onClose()
  }

  const clearFormData = () => {
    setSemver('')
    setReleaseNotes('')
    setIsMinorRelease(false)
    setArtefacts([])
    setArtefactsMetadata([])
    setImageList([])
    setErrorMessage('')
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <Box component='form' onSubmit={handleSubmit}>
        <DialogTitle color='primary'>Draft New Release</DialogTitle>
        <Divider sx={{ mx: 3 }} />
        <DialogContent sx={{ py: 2 }}>
          <Stack spacing={2}>
            <DesignServices color='primary' fontSize='large' sx={{ margin: 'auto' }} />
            <Typography>
              A release takes a snapshot of the current state of the model code, artefacts and model card. Access
              requests will be able to select for any release of a model for deployment.
            </Typography>
            <ReleaseForm
              model={model}
              formData={{
                semver,
                releaseNotes,
                isMinorRelease,
                artefacts,
                imageList,
              }}
              onSemverChange={(value) => setSemver(value)}
              onReleaseNotesChange={(value) => setReleaseNotes(value)}
              onMinorReleaseChange={(value) => setIsMinorRelease(value)}
              onArtefactsChange={(value) => setArtefacts(value)}
              artefactsMetadata={artefactsMetadata}
              onArtefactsMetadataChange={(value) => setArtefactsMetadata(value)}
              onImageListChange={(value) => setImageList(value)}
            />
          </Stack>
        </DialogContent>
        <Divider sx={{ mx: 3 }} />
        <Box sx={{ px: 2 }}>
          <MessageAlert message={errorMessage} severity='error' />
        </Box>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={handleCancel}>Cancel</Button>
          <LoadingButton
            variant='contained'
            loading={loading}
            type='submit'
            disabled={!semver || !artefacts || !releaseNotes || !isValidSemver(semver)}
          >
            Create Release
          </LoadingButton>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
