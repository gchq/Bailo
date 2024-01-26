import { Typography } from '@mui/material'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { useGetModelImages } from 'actions/model'
import { SyntheticEvent, useEffect, useMemo, useState } from 'react'
import { ModelInterface } from 'types/v2/types'
import { sortByNameAscending } from 'utils/arrayUtils'

import { FlattenedModelImage } from '../../types/interfaces'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface ModelImageListProps {
  model: ModelInterface
  value: FlattenedModelImage[]
  onChange: (value: FlattenedModelImage[]) => void
  readOnly?: boolean
}

export default function ModelImageList({ model, value, onChange, readOnly = false }: ModelImageListProps) {
  const [flattenedImageList, setFlattenedImageList] = useState<FlattenedModelImage[]>([])
  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(model.id)

  useEffect(() => {
    const updatedImageList: FlattenedModelImage[] = []
    for (const modelImage of modelImages) {
      for (const modelImageVersion of modelImage.tags) {
        updatedImageList.push({
          repository: modelImage.repository,
          name: modelImage.name,
          tag: modelImageVersion,
        })
      }
    }
    setFlattenedImageList(updatedImageList)
  }, [modelImages])

  const sortedImageList = useMemo(() => flattenedImageList.sort(sortByNameAscending), [flattenedImageList])

  function handleChange(_event: SyntheticEvent<Element, Event>, flattenedImageList: FlattenedModelImage[]) {
    onChange(flattenedImageList)
  }

  if (isModelImagesError) {
    return <MessageAlert message={isModelImagesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelImagesLoading && <Loading />}
      {readOnly ? (
        sortedImageList.map((modelImage) => (
          <Typography key={`${modelImage.repository}-${modelImage.name}`}>{modelImage.tag}</Typography>
        ))
      ) : (
        <Autocomplete
          multiple
          onChange={handleChange}
          data-test='imageListAutocomplete'
          getOptionLabel={(option) => `${option.name}:${option.tag}`}
          groupBy={(option) => option.name}
          options={sortedImageList}
          value={value}
          renderInput={(params) => <TextField {...params} size='small' value={flattenedImageList} />}
        />
      )}
    </>
  )
}
