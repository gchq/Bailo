import CancelIcon from '@mui/icons-material/Cancel'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Chip,
  Grid,
  TextField,
  Typography,
} from '@mui/material'
import { createFilterOptions } from '@mui/material/Autocomplete'
import Box from '@mui/material/Box'
import { useGetPopularEntryTags } from 'actions/entry'
import { useContext, useState } from 'react'
import UserPermissionsContext from 'src/contexts/userPermissionsContext'
import { RestrictedActionKeys } from 'types/types'

interface EntryTagSelectorProps {
  onChange: (newTag: string[]) => void
  tags: string[]
  errorText?: string
  restrictedToAction?: RestrictedActionKeys
}

export default function TagSelector({
  onChange,
  tags,
  errorText: _errorText = '',
  restrictedToAction,
}: EntryTagSelectorProps) {
  const { userPermissions } = useContext(UserPermissionsContext)
  const canEdit = !restrictedToAction || userPermissions[restrictedToAction]?.hasPermission
  const { tags: popularTags, isTagsError } = useGetPopularEntryTags()
  const [inputValue, setInputValue] = useState('')
  type TagOption = { tag: string; kind: 'popular' | 'new' }
  const filter = createFilterOptions<TagOption>()

  return (
    <Box>
      {canEdit && (
        <Accordion sx={{ backgroundColor: 'transparent' }}>
          <AccordionSummary sx={{ pl: 0, borderTop: 'none' }} expandIcon={<ExpandMoreIcon />} id='tag-add-header'>
            <Typography>Add tags</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <Autocomplete<TagOption>
              renderValue={() => null}
              options={(isTagsError ? [] : (popularTags ?? []))
                .filter((t) => !tags.includes(t))
                .map((t) => ({ tag: t, kind: 'popular' as const }))}
              inputValue={inputValue}
              onInputChange={(_, v) => setInputValue(v)}
              filterOptions={(options, params) => {
                const filtered = filter(options, params)
                const v = params.inputValue.trim()
                const lower = v.toLowerCase()
                const existsInSelected = tags.some((t) => t.toLowerCase() === lower)
                const existsInOptions = options.some((opt) => opt.tag.toLowerCase() === lower)
                if (v && !existsInSelected && !existsInOptions) {
                  filtered.push({ tag: v, kind: 'new' })
                }
                return filtered
              }}
              groupBy={(option) => (option.kind === 'popular' ? 'Suggested tags' : 'Add a new tag')}
              getOptionLabel={(option) => option.tag}
              onChange={(_, newValue) => {
                const v = newValue ? newValue.tag : ''
                const trimmed = v.trim()
                if (trimmed && !tags.includes(trimmed)) {
                  onChange([...tags, trimmed])
                }
                setInputValue('')
              }}
              filterSelectedOptions
              disabled={!canEdit}
              sx={{ mt: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label='Add a tag'
                  size='small'
                  placeholder='Type to search or add'
                  disabled={!canEdit}
                />
              )}
            />
          </AccordionDetails>
        </Accordion>
      )}
      <Grid
        container
        spacing={1}
        sx={{
          alignItems: 'center',
        }}
      >
        {tags.map((label) => (
          <Grid key={label}>
            <Chip
              variant='filled'
              label={label}
              onDelete={canEdit ? () => onChange(tags.filter((t) => t !== label)) : undefined}
              deleteIcon={<CancelIcon fontSize='small' />}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
