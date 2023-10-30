import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import { useGetModelImages } from 'actions/model'
import { Dispatch, SetStateAction, SyntheticEvent, useEffect, useState } from 'react'
import { ModelInterface } from 'types/v2/types'

import { FlattenedModelImage } from '../../types/interfaces'
import Loading from '../common/Loading'
import MessageAlert from '../MessageAlert'

interface ModelImageListProps {
  model: ModelInterface
  value: FlattenedModelImage[]
  setImages: Dispatch<SetStateAction<FlattenedModelImage[]>>
}

export default function ModelImageList({ model, value, setImages }: ModelImageListProps) {
  const { modelImages, isModelImagesLoading, isModelImagesError } = useGetModelImages(model.id)
  const [flattenedImageList, setFlattenedImageList] = useState<FlattenedModelImage[]>([])

  useEffect(() => {
    if (modelImages) {
      const updatedImageList: FlattenedModelImage[] = []
      for (const modelImage of modelImages) {
        for (const modelImageVersion of modelImage.versions) {
          updatedImageList.push({
            namespace: modelImage.namespace,
            model: modelImage.model,
            version: modelImageVersion,
          })
        }
      }
      setFlattenedImageList(updatedImageList)
    }
  }, [modelImages])

  const handleChange = (_event: SyntheticEvent<Element, Event>, FlattenedImageList: FlattenedModelImage[]) => {
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
        getOptionLabel={(option) => option.version}
        groupBy={(option) => option.model}
        options={flattenedImageList.sort((a, b) => -b.model.localeCompare(a.model))}
        value={value}
        renderInput={(params) => <TextField {...params} size='small' value={flattenedImageList} />}
      />
    </>
  )
}
