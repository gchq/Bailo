import Create from '@mui/icons-material/Create'
import { Box, Button, Link, MenuItem, Select, SelectChangeEvent, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import SchemaList from 'src/schemas/SchemaList'
import { isSchemaKind, SchemaKind, SchemaKindKeys } from 'types/types'
import { camelCaseToTitleCase } from 'utils/stringUtils'

export default function SchemaTab() {
  const router = useRouter()
  const { category } = router.query

  const [selectedCategory, setSelectedCategory] = useState<SchemaKindKeys>(
    isSchemaKind(category) ? category : SchemaKind.MODEL,
  )

  useEffect(() => {
    if (!isSchemaKind(category)) {
      router.replace({
        query: { ...router.query, category: SchemaKind.MODEL },
      })
    }
  }, [category, router])

  const listButtons = useMemo(
    () =>
      Object.values(SchemaKind).map((kind) => (
        <MenuItem value={kind} key={kind}>
          {camelCaseToTitleCase(kind)}
        </MenuItem>
      )),
    [],
  )

  const handleOrganisationSelectOnChange = useCallback((event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value as SchemaKindKeys)
  }, [])

  const schemaLists = useMemo(
    () =>
      Object.values(SchemaKind).map((kind) => (
        <Fragment key={kind}>{selectedCategory === kind && <SchemaList schemaKind={kind} />}</Fragment>
      )),
    [selectedCategory],
  )

  return (
    <Stack sx={{ m: 2 }} spacing={2}>
      <Box sx={{ textAlign: 'right' }}>
        <Link href={`/schemas/new`}>
          <Button variant='contained' startIcon={<Create />}>
            Upload a new schema
          </Button>
        </Link>
      </Box>
      <Stack sx={{ m: 2 }} spacing={2}>
        <Select
          sx={{ width: '200px', height: 'fit-content' }}
          onChange={handleOrganisationSelectOnChange}
          value={selectedCategory}
        >
          {listButtons}
        </Select>
        {schemaLists}
      </Stack>
    </Stack>
  )
}
