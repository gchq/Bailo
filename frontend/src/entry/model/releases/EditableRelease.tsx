import { Divider, Stack, Typography } from '@mui/material'
import { useGetModel } from 'actions/entry'
import {
  deleteRelease,
  putRelease,
  UpdateReleaseParams,
  useGetRelease,
  useGetReleasesForModelId,
} from 'actions/release'
import { useRouter } from 'next/router'
import { useCallback, useContext, useEffect, useState } from 'react'
import ConfirmationDialogue from 'src/common/ConfirmationDialogue'
import HelpPopover from 'src/common/HelpPopover'
import Loading from 'src/common/Loading'
import UnsavedChangesContext from 'src/contexts/unsavedChangesContext'
import ReleaseForm from 'src/entry/model/releases/ReleaseForm'
import EditableFormHeading from 'src/Form/EditableFormHeading'
import MessageAlert from 'src/MessageAlert'
import { FileInterface, FlattenedModelImage, ReleaseInterface } from 'types/types'
import { getErrorMessage } from 'utils/fetcher'

type EditableReleaseProps = {
  release: ReleaseInterface
  isEdit: boolean
  onIsEditChange: (value: boolean) => void
  readOnly?: boolean
}

export default function EditableRelease({ release, isEdit, onIsEditChange, readOnly = false }: EditableReleaseProps) {
  const [semver, setSemver] = useState(release.semver)
  const [releaseNotes, setReleaseNotes] = useState(release.notes)
  const [isMinorRelease, setIsMinorRelease] = useState(!!release.minor)
  const [files, setFiles] = useState<FileInterface[]>(release.files)
  const [imageList, setImageList] = useState<FlattenedModelImage[]>(release.images)
  const [modelCardVersion, setModelCardVersion] = useState(release.modelCardVersion)
  const [errorMessage, setErrorMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRegistryError, setIsRegistryError] = useState(false)
  const [open, setOpen] = useState(false)
  const [deleteErrorMessage, setDeleteErrorMessage] = useState('')

  const { entry: model, isEntryLoading: isModelLoading, isEntryError: isModelError } = useGetModel(release.modelId)
  const { mutateReleases } = useGetReleasesForModelId(release.modelId)
  const { mutateRelease } = useGetRelease(release.modelId, release.semver)

  const { setUnsavedChanges } = useContext(UnsavedChangesContext)
  const router = useRouter()

  const handleRegistryError = useCallback((value: boolean) => setIsRegistryError(value), [])

  const handleDeleteConfirm = useCallback(async () => {
    setErrorMessage('')
    if (model) {
      const res = await deleteRelease(model.id, semver)
      if (!res.ok) {
        setDeleteErrorMessage(await getErrorMessage(res))
      } else {
        mutateReleases()
        setOpen(false)
        router.push(`/model/${model.id}?tab=releases`)
      }
    }
  }, [model, mutateReleases, semver, router])

  const resetForm = useCallback(() => {
    setSemver(release.semver)
    setReleaseNotes(release.notes)
    setIsMinorRelease(!!release.minor)
    setFiles(release.files)
    setImageList(release.images)
  }, [release.semver, release.notes, release.minor, release.files, release.images])

  useEffect(() => {
    setUnsavedChanges(isEdit)
  }, [isEdit, setUnsavedChanges])

  if (isModelError) {
    return <MessageAlert message={isModelError.info.message} severity='error' />
  }

  if (!model || isModelLoading) {
    return <Loading />
  }

  const handleEdit = () => {
    onIsEditChange(true)
  }

  const handleCancel = () => {
    setErrorMessage('')
    resetForm()
    onIsEditChange(false)
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    const updatedRelease: UpdateReleaseParams = {
      modelId: model.id,
      semver,
      modelCardVersion: modelCardVersion,
      notes: releaseNotes,
      minor: isMinorRelease,
      fileIds: files.map((file) => file._id),
      images: imageList,
    }

    const response = await putRelease(updatedRelease)

    if (!response.ok) {
      setErrorMessage(await getErrorMessage(response))
    } else {
      mutateReleases()
      mutateRelease()
      onIsEditChange(false)
    }
    setIsLoading(false)
  }

  return (
    <Stack spacing={2}>
      <EditableFormHeading
        heading={
          <Stack
            sx={{
              overflow: 'hidden',
              justifyContent: 'center',
            }}
          >
            <Stack direction='row' spacing={1}>
              <Typography
                sx={{
                  fontWeight: 'bold',
                }}
              >
                Release name
              </Typography>
              <HelpPopover>
                The release name is automatically generated using the model name and release semantic version.
              </HelpPopover>
            </Stack>
            <Typography noWrap>{`${model.name} - ${release.semver}`}</Typography>
          </Stack>
        }
        editAction='editRelease'
        deleteAction='deleteRelease'
        editButtonText='Edit release'
        deleteButtonText='Delete release'
        isEdit={isEdit}
        isLoading={isLoading}
        onEdit={handleEdit}
        onCancel={handleCancel}
        onSubmit={handleSubmit}
        onDelete={() => setOpen(true)}
        errorMessage={errorMessage}
        isRegistryError={isRegistryError}
        readOnly={readOnly}
        disableSaveButton={releaseNotes === ''}
      />
      <Divider />
      <ReleaseForm
        editable
        isEdit={isEdit}
        model={model}
        formData={{
          semver,
          releaseNotes,
          isMinorRelease,
          files,
          imageList,
          modelCardVersion,
        }}
        onSemverChange={(value) => setSemver(value)}
        onReleaseNotesChange={(value) => setReleaseNotes(value)}
        onMinorReleaseChange={(value) => setIsMinorRelease(value)}
        onFilesChange={(value) => setFiles(value)}
        onModelCardVersionChange={(value) => setModelCardVersion(value)}
        onImageListChange={(value) => setImageList(value)}
        onRegistryError={handleRegistryError}
      />
      <ConfirmationDialogue
        open={open}
        title='Delete Release'
        onConfirm={handleDeleteConfirm}
        onCancel={() => setOpen(false)}
        errorMessage={deleteErrorMessage}
        dialogMessage={
          'Are you sure you want to delete this release? You will be unable to create a new release using this semver unless an admin restores it for you.'
        }
      />
    </Stack>
  )
}
