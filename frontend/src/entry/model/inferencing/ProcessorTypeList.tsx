import { Autocomplete, TextField, Typography } from '@mui/material'
import { SyntheticEvent, useContext, useMemo } from 'react'
import UiConfigContext from 'src/contexts/uiConfigContext'

type ProcessorTypeListProps = {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
}

export default function ProcessorTypeList({ value, onChange, readOnly = false }: ProcessorTypeListProps) {
  const uiConfig = useContext(UiConfigContext)

  const processorTypesList = useMemo(() => ['cpu', ...Object.values(uiConfig.inference.gpus)], [uiConfig])
  const readOnlyProcessorTypeList = useMemo(() => {
    processorTypesList.map((processorType) => <Typography key={processorType}>{processorType}</Typography>)
  }, [processorTypesList])

  const handleChange = (_event: SyntheticEvent, newValue: string | null) => {
    onChange(newValue || '')
  }

  return (
    <>
      {readOnly ? (
        readOnlyProcessorTypeList
      ) : (
        <Autocomplete
          data-test='processorTypesAutocomplete'
          options={processorTypesList}
          value={value}
          onChange={handleChange}
          renderInput={(params) => <TextField {...params} size='small' />}
        />
      )}
    </>
  )
}
