import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useGetUiConfig } from 'actions/uiConfig'
import { useMemo } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import Loading from 'src/common/Loading'
import MessageAlert from 'src/MessageAlert'

const htmlId = 'entry-organisation-input'

type EntryOrganisationInputProps = {
  value: string
  onChange: (value: string) => void
}

export default function EntryOrganisationInput({ value, onChange }: EntryOrganisationInputProps) {
  const { uiConfig, isUiConfigLoading, isUiConfigError } = useGetUiConfig()

  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value)
  }

  const organisationOptions = useMemo(
    () =>
      uiConfig
        ? [
            <MenuItem value={''} key='unset'>
              <em>Unset</em>
            </MenuItem>,
            ...uiConfig.modelDetails.organisations.map((organisationItem) => (
              <MenuItem value={organisationItem} key={organisationItem}>
                {organisationItem}
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

  if (uiConfig.modelDetails.organisations.length === 0) {
    return <></>
  }

  return (
    <LabelledInput fullWidth label='Organisation' htmlFor={htmlId}>
      <Select size='small' value={value} onChange={handleChange} id={htmlId}>
        {organisationOptions}
      </Select>
    </LabelledInput>
  )
}
