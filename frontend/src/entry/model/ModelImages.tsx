import { Box, Button, Container, Stack, Tooltip } from '@mui/material'
import { useGetModelImages } from 'actions/model'
import { useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import ModelImageDisplay from 'src/entry/model/registry/ModelImageDisplay'
import UploadModelImageDialog from 'src/entry/model/registry/UploadModelImageDialog'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'
import { getRequiredRolesText, hasRole } from 'utils/roles'

type AccessRequestsProps = {
  model: EntryInterface
  readOnly?: boolean
  currentUserRoles: string[]
}

export default function ModelImages({ model, currentUserRoles, readOnly = false }: AccessRequestsProps) {
  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(model.id)

  const [openUploadImageDialog, setOpenUploadImageDialog] = useState(false)

  const modelImageList = useMemo(
    () =>
      modelImages.length ? (
        modelImages.map((modelImage) => (
          <ModelImageDisplay modelImage={modelImage} key={`${modelImage.repository}-${modelImage.name}`} />
        ))
      ) : (
        <EmptyBlob text={`No images found for model ${model.name}`} />
      ),
    [modelImages, model.name],
  )

  const [canPushImage, requiredRolesText] = useMemo(() => {
    const validRoles = ['owner', 'contributor']
    return [hasRole(currentUserRoles, validRoles), getRequiredRolesText(currentUserRoles, validRoles)]
  }, [currentUserRoles])

  if (isModelImagesError) {
    if (isModelImagesError.status === 403) {
      return (
        <Forbidden
          errorMessage='If you think this is in error please contact the model owners.'
          noMargin
          hideNavButton
        />
      )
    } else {
      return <MessageAlert message={isModelImagesError.info.message} severity='error' />
    }
  }

  return (
    <>
      {isModelImagesLoading && <Loading />}
      <Container sx={{ my: 2 }}>
        <Stack spacing={4}>
          {!readOnly && (
            <>
              <Tooltip title={requiredRolesText}>
                <Box sx={{ textAlign: 'right' }}>
                  <Button
                    variant='outlined'
                    disabled={!canPushImage}
                    onClick={() => setOpenUploadImageDialog(true)}
                    data-test='pushImageButton'
                  >
                    Push Image
                  </Button>
                </Box>
              </Tooltip>
              <UploadModelImageDialog
                open={openUploadImageDialog}
                handleClose={() => setOpenUploadImageDialog(false)}
                model={model}
              />
            </>
          )}
          {modelImageList}
        </Stack>
      </Container>
    </>
  )
}
