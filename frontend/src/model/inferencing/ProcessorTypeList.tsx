import { Autocomplete, TextField, Typography } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo } from 'react'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

export default function ProcessorTypeList({ value, onChange, readOnly = false }) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const processorTypesList = useMemo(
    () => (uiConfig ? ['cpu', ...Object.values(uiConfig.inference.gpus)] : []),
    [uiConfig],
  )
  const readOnlyProcessorTypeList = useMemo(() => {
    return isUiConfigLoading ? (
      <Loading />
    ) : (
      processorTypesList.map((processorType) => <Typography key={processorType}>{processorType}</Typography>)
    )
  }, [processorTypesList, isUiConfigLoading])

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  return (
    <>
      {readOnly ? (
        readOnlyProcessorTypeList
      ) : (
        <Autocomplete
          loading={isUiConfigLoading}
          data-test='processorTypesAutocomplete'
          options={processorTypesList}
          value={value}
          onChange={onChange}
          renderInput={(params) => <TextField {...params} size='small' />}
        />
      )}
    </>
  )
}
