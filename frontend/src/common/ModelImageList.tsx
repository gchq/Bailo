import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { useGetModelImages } from 'actions/model'
import { Dispatch, SetStateAction, SyntheticEvent, useEffect, useMemo, useState } from 'react'
import { ModelInterface } from 'types/v2/types'

import { FlattenedModelImage } from '../../types/interfaces'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface ModelImageListProps {
  model: ModelInterface
  value: FlattenedModelImage[]
  setImages: Dispatch<SetStateAction<FlattenedModelImage[]>>
}

const sortByNameAscending = <T extends { name: string }>(a: T, b: T) => {
  return a.name.localeCompare(b.name)
}

export default function ModelImageList({ model, value, setImages }: ModelImageListProps) {
  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(model.id)
  const [flattenedImageList, setFlattenedImageList] = useState<FlattenedModelImage[]>([])

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

  function handleChange(_event: SyntheticEvent<Element, Event>, FlattenedImageList: FlattenedModelImage[]) {
    setImages(FlattenedImageList)
  }

  if (isModelImagesError) {
    return <MessageAlert message={isModelImagesError.info.message} severity='error' />
  }

  return (
    <>
      {isModelImagesLoading && <Loading />}
      <Autocomplete
        multiple
        onChange={handleChange}
        getOptionLabel={(option) => option.tag}
        groupBy={(option) => option.name}
        options={sortedImageList}
        value={value}
        renderInput={(params) => <TextField {...params} size='small' value={flattenedImageList} />}
      />
    </>
  )
}
