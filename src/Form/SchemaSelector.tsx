import { Dispatch, SetStateAction } from 'react'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { ExtendedSelectDisplayProps } from '@/src/types'
import { Schema } from '../../types/interfaces'

export default function SchemaSelector({
  currentSchema,
  setCurrentSchema,
  schemas,
}: {
  currentSchema: Schema
  setCurrentSchema: Dispatch<SetStateAction<Schema | undefined>>
  schemas: Array<Schema>
}) {
  const onSchemaChange = (event: any) => {
    const schema = schemas.find((cur: any) => cur.name === event.target.value)
    if (!schema) return

    setCurrentSchema(schema)
  }

  return (
    <FormControl sx={{ minWidth: 300 }}>
      <InputLabel>Schema</InputLabel>
      <Select
        value={currentSchema.name}
        label='Schema'
        onChange={onSchemaChange}
        SelectDisplayProps={
          {
            'data-test': 'selectSchemaInput',
          } as ExtendedSelectDisplayProps
        }
      >
        {schemas.map((schema: Schema) => (
          <MenuItem value={schema.name} key={`schema-${schema.reference}`}>
            {schema.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
