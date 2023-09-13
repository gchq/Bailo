import { Autocomplete, Stack, TextField, Typography } from '@mui/material'
import { useState } from 'react'

import { useGetSchemas } from '../../../../actions/schema'
import { SchemaInterface } from '../../../../types/types'
import { ModelInterface } from '../../../../types/v2/types'
import Loading from '../../../common/Loading'
import MessageAlert from '../../../MessageAlert'

interface AccessRequestSettingsProps {
  model: ModelInterface
}

export default function AccessRequestSettings({ model }: AccessRequestSettingsProps) {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  const [value, setValue] = useState<SchemaInterface>()
  const [open, setOpen] = useState(false)

  if (isSchemasError) {
    return <MessageAlert message={isSchemasError.info.message} severity='error' />
  }

  return (
    <>
      {isSchemasLoading && <Loading />}
      <Stack spacing={2}>
        <Typography variant='h6' component='h2'>
          Manage access requests
        </Typography>
        <Autocomplete
          open={open}
          value={value}
          onOpen={() => {
            setOpen(true)
          }}
          onClose={() => {
            setOpen(false)
          }}
          // we might get a string or an object back
          isOptionEqualToValue={(option: SchemaInterface, value: SchemaInterface) => option.id === value.id}
          onChange={(_event: any, newValue: SchemaInterface | null) => {
            if (newValue) {
              setValue(newValue)
            }
          }}
          getOptionLabel={(option) => option.name}
          options={schemas}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Select which schema model access requests should use'
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {isSchemasLoading && <Loading size={20} />}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Stack>
    </>
  )
}
