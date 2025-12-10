import { Card, Stack, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import Loading from 'src/common/Loading'
import Paginate from 'src/common/Paginate'
import CodeLine from 'src/entry/model/registry/CodeLine'
import MessageAlert from 'src/MessageAlert'
import { ModelImage } from 'types/types'

type ModelImageDisplayProps = {
  modelImage: ModelImage
}

export default function ModelImageDisplay({ modelImage }: ModelImageDisplayProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const modelImageTag = ({ data }) => (
    <CodeLine
      key={`${modelImage.repository}-${modelImage.name}-${data.tag}`}
      line={`${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelImage.repository}/${modelImage.name}:${data.tag}`}
    />
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
          {modelImage.tags.length >= 10 ? (
            <Paginate
              list={modelImage.tags.map((tag) => {
                return { key: tag, ...{ tag } }
              })}
              sortingProperties={[{ value: 'tag', title: 'Tag', iconKind: 'text' }]}
              searchFilterProperty={'tag'}
              defaultSortProperty='tag'
              emptyListText={`No image tags found for image ${modelImage.name}`}
            >
              {modelImageTag}
            </Paginate>
          ) : (
            modelImage.tags.map((imageTag) => (
              <CodeLine
                key={`${modelImage.repository}-${modelImage.name}-${imageTag}`}
                line={`${uiConfig ? uiConfig.registry.host : 'unknownhost'}/${modelImage.repository}/${modelImage.name}:${imageTag}`}
              />
            ))
          )}
        </Stack>
      </Card>
    </>
  )
}
