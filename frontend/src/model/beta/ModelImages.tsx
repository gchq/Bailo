import { Box, Button, Stack } from '@mui/material'
import { useGetModelImages } from 'actions/model'
import { useMemo, useState } from 'react'

import { ModelInterface } from '../../../types/v2/types'
import EmptyBlob from '../../common/EmptyBlob'
import Loading from '../../common/Loading'
import MessageAlert from '../../MessageAlert'
import ModelImageDisplay from './registry/ModelImageDisplay'
import UploadNewImageDialog from './registry/UploadNewImageDialog'

type AccessRequestsProps = {
  model: ModelInterface
}

export default function ModelImages({ model }: AccessRequestsProps) {
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

  if (isModelImagesError) {
    return <MessageAlert message={isModelImagesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelImagesLoading && <Loading />}
      <Box sx={{ maxWidth: '900px', mx: 'auto', my: 4 }}>
        <Stack spacing={4}>
          <Box sx={{ textAlign: 'right' }}>
            <Button variant='outlined' onClick={() => setOpenUploadImageDialog(true)} disabled={!model.card}>
              Push image
            </Button>
            <UploadNewImageDialog
              open={openUploadImageDialog}
              handleClose={() => setOpenUploadImageDialog(false)}
              model={model}
            />
          </Box>
          {modelImageList}
        </Stack>
      </Box>
    </>
  )
}
