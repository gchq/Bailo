import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

const htmlId = 'entry-state-input'

type EntryStateInputProps = {
  value: string
  onChange: (value: string) => void
}

export default function EntryStateInput({ value, onChange }: EntryStateInputProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value)
  }

  const stateOptions = useMemo(
    () =>
      uiConfig
        ? [
            <MenuItem value={''} key='unset'>
              <em>Unset</em>
            </MenuItem>,
            ...uiConfig.modelDetails.states.map((stateItem) => (
              <MenuItem value={stateItem} key={stateItem}>
                {stateItem}
              </MenuItem>
            )),
          ]
        : [],
    [uiConfig],
  )

  if (isUiConfigError) {
    return <MessageAlert message={isUiConfigError.info.message} severity='error' />
  }

  if (!uiConfig || isUiConfigLoading) {
    return <Loading />
  }

  if (uiConfig.modelDetails.states.length === 0) {
    return <></>
  }

  return (
    <LabelledInput fullWidth label='State (optional)' htmlFor={htmlId}>
      <Select size='small' value={value} onChange={handleChange} id={htmlId}>
        {stateOptions}
      </Select>
    </LabelledInput>
  )
}
