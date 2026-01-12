import { Add } from '@mui/icons-material'
import { Box, Button, Container, Stack } from '@mui/material'
import { useGetModelImages } from 'actions/model'
import { useState } from 'react'
import Forbidden from 'src/common/Forbidden'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
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

  const modelImageListItem = ({ data }) => (
    <ModelImageDisplay modelImage={data} key={`${data.repository}-${data.name}`} />
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
      <Container sx={{ my: 2 }}>
        <Stack spacing={4}>
          {!readOnly && (
            <>
              <Box display='flex'>
                <Box ml='auto'>
                  <Restricted action='pushModelImage' fallback={<Button disabled>Push image</Button>}>
                    <Button
                      variant='outlined'
                      onClick={() => setOpenUploadImageDialog(true)}
                      data-test='pushImageButton'
                      startIcon={<Add />}
                    >
                      Push image
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
          {isModelImagesLoading ? (
            <Loading />
          ) : (
            <Paginate
              list={modelImages.map((image) => {
                return { key: `${image.repository}-${image.name}`, ...image }
              })}
              emptyListText={`No images found for model ${model.name}`}
              searchFilterProperty='name'
              sortingProperties={[{ value: 'name', title: 'Name', iconKind: 'text' }]}
              defaultSortProperty='name'
              searchPlaceholderText='Search by image name'
            >
              {modelImageListItem}
            </Paginate>
          )}
        </Stack>
      </Container>
    </>
  )
}
