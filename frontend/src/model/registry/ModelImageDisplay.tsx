import { Card, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import CodeLine from 'src/model/registry/CodeLine'

import { ModelImage } from '../../../types/types'

type ModelImageDisplayProps = {
  modelImage: ModelImage
}

export default function ModelImageDisplay({ modelImage }: ModelImageDisplayProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const modelImageTags = useMemo(
    () =>
      uiConfig &&
      modelImage.tags.map((imageTag) => (
        <CodeLine
          key={`${modelImage.repository}-${modelImage.name}-${imageTag}`}
          line={`${uiConfig.registry.host}/${modelImage.repository}/${modelImage.name}:${imageTag}`}
        />
      )),
    [modelImage, uiConfig],
  )

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <>
      {isUiConfigLoading && <Loading />}
      <Card
        sx={{
          width: '100%',
          p: 2,
        }}
      >
        <Stack direction='column' spacing={1}>
          <Typography component='h2' variant='h6' color='primary'>
            {modelImage.name}
          </Typography>
          {modelImageTags}
        </Stack>
      </Card>
    </>
  )
}
