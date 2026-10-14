import { MenuItem, Select, SelectChangeEvent } from '@mui/material'
import { useContext, useMemo } from 'react'
import LabelledInput from 'src/common/LabelledInput'
import UiConfigContext from 'src/contexts/uiConfigContext'

const htmlId = 'entry-organisation-input'

type EntryOrganisationInputProps = {
  value: string
  onChange: (value: string) => void
}

export default function EntryOrganisationInput({ value, onChange }: EntryOrganisationInputProps) {
  const uiConfig = useContext(UiConfigContext)

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

  if (uiConfig.modelDetails.organisations.length === 0) {
    return <></>
  }

  return (
    <LabelledInput fullWidth label='Organisation' htmlFor={htmlId}>
      <Select
        aria-label='toggle entry organisation menu'
        size='small'
        value={value}
        onChange={handleChange}
        id={htmlId}
      >
        {organisationOptions}
      </Select>
    </LabelledInput>
  )
}
