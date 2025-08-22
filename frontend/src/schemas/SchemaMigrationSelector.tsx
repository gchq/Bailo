import { Container, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material'
import { useGetSchemas } from 'actions/schema'
import { useMemo, useState } from 'react'
import Loading from 'src/common/Loading'
import MultipleErrorWrapper from 'src/errors/MultipleErrorWrapper'
import SchemaMigrator from 'src/schemas/SchemaMigrator'

export default function SchemaMigrationSelector() {
  const { schemas, isSchemasLoading, isSchemasError } = useGetSchemas()

  const [sourceSchema, setSourceSchema] = useState<string>('')
  const [targetSchema, setTargetSchema] = useState<string>('')

  const schemaOptions = useMemo(() => {
    if (schemas) {
      return schemas.map((filteredSchema) => (
        <MenuItem
          key={filteredSchema.id}
          value={filteredSchema.id}
          disabled={filteredSchema.id === sourceSchema || filteredSchema.id === targetSchema}
        >
          {filteredSchema.name}
        </MenuItem>
      ))
    } else {
      return (
        <MenuItem>
          <em>No schemas found</em>
        </MenuItem>
      )
    }
  }, [schemas, sourceSchema, targetSchema])

  if (isSchemasLoading) {
    return <Loading />
  }

  const handleSourceSchemaChange = (event: SelectChangeEvent) => {
    const schemaFromInput = schemas.find((schema) => schema.id === event.target.value)
    setSourceSchema(schemaFromInput ? schemaFromInput.id : 'test')
  }

  const handleTargetSchemaChange = (event: SelectChangeEvent) => {
    const schemaFromInput = schemas.find((schema) => schema.id === event.target.value)
    setTargetSchema(schemaFromInput ? schemaFromInput.id : '')
  }

  const error = MultipleErrorWrapper(`Unable to load schema page`, {
    isSchemasError,
  })
  if (error) return error

  return (
    <Container maxWidth='xl'>
      <Stack spacing={8}>
        <Stack spacing={2} direction='row' sx={{ width: '100%' }}>
          <Select
            aria-label='toggle entry state menu'
            size='small'
            value={sourceSchema}
            onChange={handleSourceSchemaChange}
            id='source-schema-select'
          >
            {schemaOptions}
          </Select>
          <Select
            aria-label='toggle entry state menu'
            size='small'
            value={targetSchema}
            onChange={handleTargetSchemaChange}
            id='target-schema-select'
          >
            {schemaOptions}
          </Select>
        </Stack>
        <SchemaMigrator
          sourceSchema={schemas.find((schema) => schema.id === sourceSchema)}
          targetSchema={schemas.find((schema) => schema.id === targetSchema)}
        ></SchemaMigrator>
      </Stack>
    </Container>
  )
}
