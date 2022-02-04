import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'

import { Schema } from '../../types/interfaces'

export default function SchemaSelector({ currentSchema, setCurrentSchema, schemas }: {
  currentSchema: Schema,
  setCurrentSchema: Function,
  schemas: Array<Schema>
}) {
  const onSchemaChange = (event: any) => {
    const schema = schemas.find((cur: any) => cur.name === event.target.value)
    setCurrentSchema(schema)
  }

  return <>
    <FormControl sx={{ minWidth: 300 }}>
      <InputLabel id='schema-label'>Schema</InputLabel>
      <Select
        labelId='schema-selector-label'
        id='schema-selector'
        value={currentSchema.name}
        label='Schema'
        onChange={onSchemaChange}
      >
        {schemas.map((schema: Schema, index: number) => (
          <MenuItem key={`schema-${index}`} value={schema.name}>
            {schema.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </>
}