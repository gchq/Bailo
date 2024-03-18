import { Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { useGetModelImages } from 'actions/model'
import { SyntheticEvent, useMemo } from 'react'
import Loading from 'src/common/Loading'
import { sortByNameAscending } from 'utils/arrayUtils'

import { FlattenedModelImage, ModelInterface } from '../../types/types'
import MessageAlert from '../MessageAlert'

type PartialModelImageListProps =
  | {
      multiple: true
      value: FlattenedModelImage[]
      onChange: (val: FlattenedModelImage[]) => void
    }
  | {
      multiple?: false
      value?: FlattenedModelImage | undefined
      onChange: (val: FlattenedModelImage) => void
    }

type ModelImageListProps = {
  model: ModelInterface
  readOnly?: boolean
} & PartialModelImageListProps

export default function ModelImageList({ model, value, onChange, readOnly = false, multiple }: ModelImageListProps) {
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
    ) : multiple ? (
      value.map((modelImage) => (
        <Typography key={`${modelImage.repository}-${modelImage.name}`}>
          {`${modelImage.name}:${modelImage.tag}`}
        </Typography>
      ))
    ) : (
      <Typography>{value ? `${value.name}:${value.tag}` : ''}</Typography>
    )
  }, [isModelImagesLoading, value, multiple])

  function handleChange(
    _event: SyntheticEvent<Element, Event>,
    flattenedImages: FlattenedModelImage[] | FlattenedModelImage | null,
  ) {
    if (multiple) {
      onChange([...(flattenedImages as FlattenedModelImage[])])
    } else {
      onChange(flattenedImages as FlattenedModelImage)
    }
  }

  if (isModelImagesError) {
    return <MessageAlert message={isModelImagesError.info.message} severity='error' />
  }

  return (
    <>
      {readOnly ? (
        readOnlyImageList
      ) : multiple ? (
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
      ) : (
        <Autocomplete
          loading={isModelImagesLoading}
          onChange={handleChange}
          data-test='imageAutocomplete'
          getOptionLabel={(option) => `${option.name}:${option.tag}`}
          options={sortedImageList}
          value={value}
          renderInput={(params) => <TextField {...params} size='small' />}
        />
      )}
    </>
  )
}
