import { Typography } from '@mui/material'
import Autocomplete, { AutocompleteRenderInputParams } from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { useGetModelImages } from 'actions/model'
import { SyntheticEvent, useEffect, useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'
import { EntryInterface, FlattenedModelImage } from 'types/types'
import { sortByNameAscending } from 'utils/arrayUtils'

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
  model: EntryInterface
  onRegistryError: (value: boolean) => void
  readOnly?: boolean
} & PartialModelImageListProps

export default function ModelImageList({
  model,
  value,
  onChange,
  onRegistryError,
  readOnly = false,
  multiple,
}: ModelImageListProps) {
  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(model.id)

  useEffect(() => {
    onRegistryError(!!isModelImagesError)
  }, [isModelImagesError, onRegistryError])

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

  if (readOnly) {
    return <>{readOnlyImageList}</>
  }

  const partialAutocompleteProps = {
    loading: isModelImagesLoading,
    onChange: handleChange,
    getOptionLabel: (option: FlattenedModelImage) => `${option.name}:${option.tag}`,
    groupBy: (option: FlattenedModelImage) => option.name,
    options: sortedImageList,
    renderInput: (params: AutocompleteRenderInputParams) => <TextField {...params} size='small' />,
    'data-test': 'imageListAutocomplete',
  }

  return multiple ? (
    <Autocomplete multiple value={value} {...partialAutocompleteProps} />
  ) : (
    <Autocomplete value={value} {...partialAutocompleteProps} />
  )
}
