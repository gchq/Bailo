import { Container, Divider, List, Stack } from '@mui/material'
import { useRouter } from 'next/router'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import SimpleListItemButton from 'src/common/SimpleListItemButton'
import SchemaList from 'src/schemas/SchemaList'
import { isSchemaKind, SchemaKind, SchemaKindKeys } from 'types/types'
import { camelCaseToTitleCase } from 'utils/stringUtils'

export default function SchemaTab() {
  const [selectedCategory, setSelectedCategory] = useState<SchemaKindKeys>(SchemaKind.MODEL)
  const router = useRouter()

  const { category } = router.query

  useEffect(() => {
    if (isSchemaKind(category)) {
      setSelectedCategory(category)
    } else if (category) {
      setSelectedCategory(SchemaKind.MODEL)
      router.replace({
        query: { ...router.query, category: SchemaKind.MODEL },
      })
    }
  }, [category, router])

  const handleListItemClick = useCallback(
    (category: SchemaKindKeys) => {
      setSelectedCategory(category)
      router.replace({
        query: { ...router.query, category },
      })
    },
    [router],
  )

  const listButtons = useMemo(
    () =>
      Object.values(SchemaKind).map((kind) => (
        <SimpleListItemButton selected={selectedCategory === kind} onClick={() => handleListItemClick(kind)} key={kind}>
          {camelCaseToTitleCase(kind)}
        </SimpleListItemButton>
      )),
    [handleListItemClick, selectedCategory],
  )

  const schemaLists = useMemo(
    () =>
      Object.values(SchemaKind).map((kind) => (
        <Fragment key={kind}>{selectedCategory === kind && <SchemaList schemaKind={kind} />}</Fragment>
      )),
    [selectedCategory],
  )

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ sm: 2 }}
      divider={<Divider orientation='vertical' flexItem />}
    >
      <List sx={{ width: '200px' }}>{listButtons}</List>
      <Container sx={{ my: 2 }}>{schemaLists}</Container>
    </Stack>
  )
}
