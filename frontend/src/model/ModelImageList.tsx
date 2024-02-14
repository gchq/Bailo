import { Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { useGetModelImages } from 'actions/model'
import { SyntheticEvent, useMemo } from 'react'
import Loading from 'src/common/Loading'
import { sortByNameAscending } from 'utils/arrayUtils'

import { FlattenedModelImage, ModelInterface } from '../../types/interfaces'
import MessageAlert from '../MessageAlert'

interface ModelImageListProps {
  model: ModelInterface
  value: FlattenedModelImage[]
  onChange: (value: FlattenedModelImage[]) => void
  readOnly?: boolean
}

export default function ModelImageList({ model, value, onChange, readOnly = false }: ModelImageListProps) {
  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(model.id)

  const sortedImageList = useMemo(() => {
    const flattenedImageList: FlattenedModelImage[] = []

    for (const modelImage of modelImages) {
      for (const modelImageVersion of modelImage.tags) {
        flattenedImageList.push({
          repository: modelImage.repository,
          name: modelImage.name,
          tag: modelImageVersion,
        })
      }
    }

    return flattenedImageList.sort(sortByNameAscending)
  }, [modelImages])

  const readOnlyImageList = useMemo(() => {
    return isModelImagesLoading ? (
      <Loading />
    ) : (
      sortedImageList.map((modelImage) => (
        <Typography key={`${modelImage.repository}-${modelImage.name}`}>
          {`${modelImage.name}:${modelImage.tag}`}
        </Typography>
      ))
    )
  }, [isModelImagesLoading, sortedImageList])

  function handleChange(_event: SyntheticEvent<Element, Event>, flattenedImageList: FlattenedModelImage[]) {
    onChange(flattenedImageList)
  }

  if (isModelImagesError) {
    return <MessageAlert message={isModelImagesError.info.message} severity='error' />
  }

  return (
    <>
      {readOnly ? (
        readOnlyImageList
      ) : (
        <Autocomplete
          multiple
          loading={isModelImagesLoading}
          onChange={handleChange}
          data-test='imageListAutocomplete'
          getOptionLabel={(option) => `${option.name}:${option.tag}`}
          groupBy={(option) => option.name}
          options={sortedImageList}
          value={value}
          renderInput={(params) => <TextField {...params} size='small' />}
        />
      )}
    </>
  )
}
