import { Box, Button, Container, Stack } from '@mui/material'
import { useGetModelImages } from 'actions/model'
import { useMemo, useState } from 'react'
import EmptyBlob from 'src/common/EmptyBlob'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import Restricted from 'src/common/Restricted'
import ModelImageDisplay from 'src/entry/model/registry/ModelImageDisplay'
import UploadModelImageDialog from 'src/entry/model/registry/UploadModelImageDialog'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface } from 'types/types'

type AccessRequestsProps = {
  model: EntryInterface
  readOnly?: boolean
}

export default function ModelImages({ model, readOnly = false }: AccessRequestsProps) {
  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(model.id)

  const [openUploadImageDialog, setOpenUploadImageDialog] = useState(false)

  const modelImageList = useMemo(
    () =>
      modelImages.length ? (
        modelImages.map((modelImage) => (
          <ModelImageDisplay modelImage={modelImage} key={`${modelImage.repository}-${modelImage.name}`} />
        ))
      ) : (
        <Box sx={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
          <EmptyBlob text={`No images found for model ${model.name}`} />
        </Box>
      ),
    [modelImages, model.name],
  )

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
              <Box display='flex'>
                <Box ml='auto'>
                  <Restricted action='pushModelImage' fallback={<Button disabled>Push Image</Button>}>
                    <Button
                      variant='outlined'
                      onClick={() => setOpenUploadImageDialog(true)}
                      data-test='pushImageButton'
                    >
                      Push Image
                    </Button>
                  </Restricted>
                </Box>
              </Box>
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
