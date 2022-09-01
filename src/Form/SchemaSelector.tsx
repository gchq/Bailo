import { Dispatch, SetStateAction } from 'react'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
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
      <InputLabel id='schema-label'>Schema</InputLabel>
      <Select
        labelId='schema-selector-label'
        id='schema-selector'
        value={currentSchema.name}
        label='Schema'
        onChange={onSchemaChange}
      >
        {schemas.map((schema: Schema) => (
          <MenuItem key={`schema-${schema.reference}`} value={schema.name}>
            {schema.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}
